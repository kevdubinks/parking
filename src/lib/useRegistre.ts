'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabaseNavigateur } from './supabase/client'
import {
  confirmer,
  ecrireReglages,
  enfiler,
  incrementerTentatives,
  lireAttente,
  lireJournal,
  lireReglages,
  projeter,
  remplacerJournal,
  retirerDeLaFile,
} from './journal'
import { REPLI } from './config'
import type {
  Etablissement,
  Evenement,
  EtatReseau,
  TypeEvenement,
  VehiculePresent,
} from './types'
import { normaliser } from './plaque'
import { estRefusServeur, messageRefus, plusAncien } from './refus'

const COLONNES = 'id,etablissement_id,type,plaque,plaque_saisie,chambre,survenu_le,auteur'

/** Identité tirée du jeton — jamais du corps d'une requête. */
type Identite = { etablissementId: string; userId: string }

export type Registre = {
  pret: boolean
  identite: Identite | null
  /**
   * Réglages lus en base, ou dernière valeur connue hors ligne, ou
   * repli neutre au tout premier chargement. Jamais des valeurs
   * inventées qui pourraient passer pour réelles.
   */
  etablissement: Etablissement
  /** false tant qu'aucune lecture réussie n'a jamais eu lieu. */
  reglagesConnus: boolean
  presents: VehiculePresent[]
  enAttente: number
  /** Horodatage du plus vieux enregistrement non parti, ou null. */
  attenteDepuis: string | null
  reseau: EtatReseau
  /** Raison du refus serveur, à lire par qui a installé l'outil. */
  refus: string | null
  erreur: string | null
  entrer: (plaqueSaisie: string, chambre: string | null) => Promise<void>
  sortir: (plaque: string) => Promise<string | null>
  annulerSortie: (idEvenement: string) => Promise<boolean>
  synchroniser: () => Promise<void>
}

export function useRegistre(): Registre {
  const supabase = supabaseNavigateur()
  const [pret, setPret] = useState(false)
  const [identite, setIdentite] = useState<Identite | null>(null)
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [idsEnAttente, setIdsEnAttente] = useState<ReadonlySet<string>>(new Set())
  const [reseau, setReseau] = useState<EtatReseau>('en-ligne')
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null)
  const [refus, setRefus] = useState<string | null>(null)
  const [attenteDepuis, setAttenteDepuis] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const syncEnCours = useRef(false)

  /** Recalcule l'état affiché depuis le local. Aucune requête réseau. */
  const rafraichirDepuisLocal = useCallback(async () => {
    const [journal, attente] = await Promise.all([lireJournal(), lireAttente()])
    setEvenements([...journal, ...attente])
    setIdsEnAttente(new Set(attente.map((e) => e.id)))
    // Âge du plus vieux enregistrement resté sur l'appareil. C'est LA
    // mesure qui compte : trois minutes est une coupure, six heures est
    // une panne que personne n'a vue.
    setAttenteDepuis(plusAncien(attente.map((e) => e.survenu_le)))
  }, [])

  /**
   * Pousse la file, puis relit le serveur.
   *
   * Deux échecs très différents se cachent derrière un `catch` :
   *
   *   le serveur est injoignable  -> normal, la file rejouera seule ;
   *   le serveur a répondu « non » -> ne se répare pas tout seul.
   *
   * Le second cas est le dangereux : réseau debout, écran serein, et
   * des enregistrements qui s'accumulent sur un seul appareil sans
   * jamais partir. Il doit remonter jusqu'à l'écran.
   */
  const synchroniser = useCallback(async () => {
    if (syncEnCours.current) return
    syncEnCours.current = true
    setReseau('synchronisation')
    try {
      const attente = await lireAttente()

      if (attente.length) {
        const lignes = attente.map(({ tentatives: _tentatives, ...e }) => e)
        // on conflict (id) do nothing — un rejeu ne duplique rien.
        const { error } = await supabase
          .from('evenement')
          .upsert(lignes, { onConflict: 'id', ignoreDuplicates: true })
        if (error) {
          await incrementerTentatives(attente.map((e) => e.id))
          throw error
        }
        await confirmer(lignes)
      }

      // Les réglages viennent de la base, comme le reste. Le RLS ne
      // renvoie que l'établissement du jeton : pas de filtre à écrire
      // ici, et rien à choisir côté client.
      const { data: etab, error: erreurEtab } = await supabase
        .from('etablissement')
        .select('id,nom,places,chambre_obligatoire,conservation_jours,fuseau,afficher_occupation')
        .maybeSingle()
      if (erreurEtab) throw erreurEtab
      if (etab) {
        await ecrireReglages(etab as Etablissement)
        setEtablissement(etab as Etablissement)
      }

      const { data, error } = await supabase
        .from('evenement')
        .select(COLONNES)
        .order('survenu_le', { ascending: false })
        .limit(5000)
      if (error) throw error

      await remplacerJournal((data ?? []) as Evenement[])
      await rafraichirDepuisLocal()
      setReseau('en-ligne')
      setRefus(null)
      setErreur(null)
    } catch (e) {
      await rafraichirDepuisLocal()

      if (estRefusServeur(e, navigator.onLine)) {
        // PostgREST a répondu avec un code : 42501 = politique RLS,
        // PGRST301 = jeton invalide ou expiré. Réessayer à l'infini ne
        // corrigera rien.
        setReseau('refuse')
        setRefus(messageRefus(e))
      } else {
        // Injoignable. État normal dans un hôtel : on ne dramatise pas.
        setReseau('hors-ligne')
        setRefus(null)
      }
    } finally {
      syncEnCours.current = false
    }
  }, [supabase, rafraichirDepuisLocal])

  // Démarrage : identité, état local immédiat, puis synchronisation.
  useEffect(() => {
    let vivant = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      const etablissementId =
        (session?.user?.app_metadata as { etablissement_id?: string } | undefined)
          ?.etablissement_id ?? null

      if (!vivant) return

      if (session?.user && etablissementId) {
        setIdentite({ etablissementId, userId: session.user.id })
      } else if (session?.user) {
        setErreur(
          "Ce compte n'est rattaché à aucun établissement. Vérifiez la table membre et le hook JWT."
        )
      }

      // Réglages du dernier passage : l'écran s'ouvre avec les bonnes
      // valeurs avant même que le réseau ait répondu.
      const enCache = await lireReglages()
      if (enCache && vivant) setEtablissement(enCache)

      await rafraichirDepuisLocal()
      setPret(true)
      if (etablissementId) await synchroniser()
    })()
    return () => {
      vivant = false
    }
  }, [supabase, rafraichirDepuisLocal, synchroniser])

  // Reprise dès que le réseau revient, et rattrapage périodique.
  useEffect(() => {
    // On ne déclare pas « en ligne » d'autorité : c'est la
    // synchronisation qui tranche. Sinon le retour du réseau efface
    // l'affichage d'un refus serveur qui, lui, n'a pas disparu.
    const revenu = () => void synchroniser()
    const perdu = () => setReseau('hors-ligne')
    window.addEventListener('online', revenu)
    window.addEventListener('offline', perdu)
    if (!navigator.onLine) setReseau('hors-ligne')

    const minuterie = setInterval(() => {
      if (navigator.onLine) void synchroniser()
    }, 60000)

    return () => {
      window.removeEventListener('online', revenu)
      window.removeEventListener('offline', perdu)
      clearInterval(minuterie)
    }
  }, [synchroniser])

  const ecrire = useCallback(
    async (type: TypeEvenement, plaqueSaisie: string, chambre: string | null) => {
      if (!identite) return null
      const evenement: Evenement = {
        id: crypto.randomUUID(),
        etablissement_id: identite.etablissementId,
        type,
        plaque: normaliser(plaqueSaisie),
        plaque_saisie: plaqueSaisie.trim(),
        chambre: chambre?.trim() || null,
        survenu_le: new Date().toISOString(),
        auteur: identite.userId,
      }
      await enfiler(evenement)
      await rafraichirDepuisLocal()
      void synchroniser()
      return evenement.id
    },
    [identite, rafraichirDepuisLocal, synchroniser]
  )

  const entrer = useCallback(
    async (plaqueSaisie: string, chambre: string | null) => {
      await ecrire('ENTREE', plaqueSaisie, chambre)
    },
    [ecrire]
  )

  const sortir = useCallback(
    async (plaque: string) => {
      const present = projeter(evenements).find((v) => v.plaque === plaque)
      return ecrire('SORTIE', present?.plaque_saisie ?? plaque, null)
    },
    [ecrire, evenements]
  )

  const presents = useMemo(
    () => projeter(evenements, idsEnAttente),
    [evenements, idsEnAttente]
  )

  /**
   * Annulation dans la fenêtre de 6 secondes : l'événement n'a pas
   * encore quitté la file, on le retire. S'il est déjà parti, on
   * n'efface rien — on le dit à l'appelante, qui affichera la vérité.
   */
  const annulerSortie = useCallback(
    async (idEvenement: string) => {
      const retire = await retirerDeLaFile(idEvenement)
      await rafraichirDepuisLocal()
      return retire
    },
    [rafraichirDepuisLocal]
  )

  return {
    pret,
    identite,
    etablissement: etablissement ?? REPLI,
    reglagesConnus: etablissement !== null,
    presents,
    enAttente: idsEnAttente.size,
    attenteDepuis,
    reseau,
    refus,
    erreur,
    entrer,
    sortir,
    annulerSortie,
    synchroniser,
  }
}
