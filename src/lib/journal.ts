'use client'

import type { Evenement, EvenementEnAttente, VehiculePresent } from './types'

/**
 * Journal local (IndexedDB) et file d'attente hors-ligne.
 *
 * Le réseau d'un hôtel coupe. Si la saisie échoue à ce moment-là, le
 * personnel arrête de saisir et le registre devient faux — c'est le
 * seul risque qui tue le produit (CLAUDE.md § 2).
 *
 * Donc : on écrit TOUJOURS en local d'abord, l'écran répond
 * immédiatement, et l'envoi au serveur est un détail qui se règle plus
 * tard. L'`id` étant généré ici, un rejeu de la file est idempotent —
 * côté serveur c'est un `on conflict (id) do nothing`.
 *
 * Deux magasins :
 *   journal — événements confirmés par le serveur
 *   attente — événements créés ici, pas encore acceptés
 * L'état affiché est la projection de l'union des deux.
 */

const BASE = 'parking-hotel'
const VERSION = 1
const JOURNAL = 'journal'
const ATTENTE = 'attente'

let ouverture: Promise<IDBDatabase> | null = null

function ouvrir(): Promise<IDBDatabase> {
  if (ouverture) return ouverture
  ouverture = new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, VERSION)
    requete.onupgradeneeded = () => {
      const db = requete.result
      if (!db.objectStoreNames.contains(JOURNAL)) db.createObjectStore(JOURNAL, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(ATTENTE)) db.createObjectStore(ATTENTE, { keyPath: 'id' })
    }
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error)
  })
  return ouverture
}

function transaction<T>(
  magasins: string[],
  mode: IDBTransactionMode,
  action: (tx: IDBTransaction) => Promise<T> | T
): Promise<T> {
  return ouvrir().then(
    (db) =>
      new Promise<T>((resoudre, rejeter) => {
        const tx = db.transaction(magasins, mode)
        let resultat: T
        tx.oncomplete = () => resoudre(resultat)
        tx.onerror = () => rejeter(tx.error)
        tx.onabort = () => rejeter(tx.error)
        Promise.resolve(action(tx)).then(
          (r) => {
            resultat = r
          },
          rejeter
        )
      })
  )
}

function attendre<T>(requete: IDBRequest<T>): Promise<T> {
  return new Promise((resoudre, rejeter) => {
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error)
  })
}

export async function lireJournal(): Promise<Evenement[]> {
  return transaction([JOURNAL], 'readonly', (tx) =>
    attendre(tx.objectStore(JOURNAL).getAll() as IDBRequest<Evenement[]>)
  )
}

export async function lireAttente(): Promise<EvenementEnAttente[]> {
  return transaction([ATTENTE], 'readonly', (tx) =>
    attendre(tx.objectStore(ATTENTE).getAll() as IDBRequest<EvenementEnAttente[]>)
  )
}

/** Remplace le journal confirmé par ce que le serveur vient de renvoyer. */
export async function remplacerJournal(evenements: Evenement[]): Promise<void> {
  await transaction([JOURNAL], 'readwrite', async (tx) => {
    const magasin = tx.objectStore(JOURNAL)
    await attendre(magasin.clear())
    evenements.forEach((e) => magasin.put(e))
  })
}

/** Empile un fait. Retourne immédiatement : l'écran ne doit pas attendre le réseau. */
export async function enfiler(evenement: Evenement): Promise<void> {
  await transaction([ATTENTE], 'readwrite', (tx) => {
    tx.objectStore(ATTENTE).put({ ...evenement, tentatives: 0 })
  })
}

/**
 * Retire un événement de la file. Utilisé pour l'annulation d'une sortie
 * dans les 6 secondes : tant qu'il n'est pas parti, autant ne pas
 * l'envoyer du tout. Retourne `true` si l'événement était encore là.
 *
 * Passé ce délai, la correction se fait par un nouvel événement, jamais
 * par un effacement — c'est la règle du journal append-only.
 */
export async function retirerDeLaFile(id: string): Promise<boolean> {
  return transaction([ATTENTE], 'readwrite', async (tx) => {
    const magasin = tx.objectStore(ATTENTE)
    const existant = await attendre(magasin.get(id) as IDBRequest<EvenementEnAttente | undefined>)
    if (!existant) return false
    magasin.delete(id)
    return true
  })
}

/** Marque comme confirmés : les événements passent de la file au journal. */
export async function confirmer(evenements: Evenement[]): Promise<void> {
  if (!evenements.length) return
  await transaction([JOURNAL, ATTENTE], 'readwrite', (tx) => {
    const journal = tx.objectStore(JOURNAL)
    const attente = tx.objectStore(ATTENTE)
    evenements.forEach(({ ...e }) => {
      delete (e as Partial<EvenementEnAttente>).tentatives
      journal.put(e)
      attente.delete(e.id)
    })
  })
}

export async function incrementerTentatives(ids: string[]): Promise<void> {
  if (!ids.length) return
  await transaction([ATTENTE], 'readwrite', async (tx) => {
    const magasin = tx.objectStore(ATTENTE)
    for (const id of ids) {
      const e = await attendre(magasin.get(id) as IDBRequest<EvenementEnAttente | undefined>)
      if (e) magasin.put({ ...e, tentatives: e.tentatives + 1 })
    }
  })
}

/**
 * Projection : quelles voitures sont sur le parking maintenant.
 *
 * Même règle que la vue `vehicule_present` côté base — le dernier
 * événement de chaque plaque, gardé s'il s'agit d'une ENTREE. Les deux
 * implémentations doivent rester d'accord ; c'est le prix du hors-ligne.
 */
export function projeter(
  evenements: Evenement[],
  idsEnAttente: ReadonlySet<string> = new Set()
): VehiculePresent[] {
  const dernier = new Map<string, Evenement>()

  for (const e of evenements) {
    const connu = dernier.get(e.plaque)
    if (!connu || new Date(e.survenu_le) >= new Date(connu.survenu_le)) {
      dernier.set(e.plaque, e)
    }
  }

  return [...dernier.values()]
    .filter((e) => e.type === 'ENTREE')
    .map((e) => ({
      plaque: e.plaque,
      plaque_saisie: e.plaque_saisie,
      chambre: e.chambre,
      entree_le: e.survenu_le,
      enAttente: idsEnAttente.has(e.id),
    }))
    .sort((a, b) => +new Date(b.entree_le) - +new Date(a.entree_le))
}
