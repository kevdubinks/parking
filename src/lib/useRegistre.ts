'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabaseNavigateur } from './supabase/client'
import {
  confirmer,
  ecrireReglages,
  envoyables,
  prochaineRetenue,
  enfiler,
  incrementerTentatives,
  lireAttente,
  lireJournal,
  lireReglages,
  projeter,
  remplacerJournal,
  retirerDeLaFile,
} from './journal'
import { DELAI_ANNULATION, REPLI } from './config'
import type {
  Etablissement,
  Evenement,
  EtatReseau,
  TypeEvenement,
  VehiculePresent,
} from './types'
import { normaliser } from './plaque'
import { estRefusServeur, messageRefus, plusAncien } from './refus'
import { claimsDuJeton } from './jeton'

/** Garde-fou mémoire sur le journal local rapatrié. */
const PLAFOND_JOURNAL = 5000

const COLONNES = 'id,etablissement_id,type,plaque,plaque_saisie,chambre,survenu_le,auteur'

/** Identité tirée du jeton — jamais du corps d'une requête. */
type Identite = { etablissementId: string; userId: string; role: string }

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
  // Délai avant expiration de la plus proche retenue d'annulation.
  const [retenueMs, setRetenueMs] = useState<number | null>(null)
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
    setRetenueMs(prochaineRetenue(attente))
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
      // Une sortie retenue pour la fenêtre d'annulation ne part pas
      // encore : c'est ce qui rend le bouton « Annuler » réel.
      const aEnvoyer = envoyables(attente)

      if (aEnvoyer.length) {
        const lignes = aEnvoyer.map(
          ({ tentatives: _t, retenu_jusqu: _r, ...e }) => e
        )
        // on conflict (id) do nothing — un rejeu ne duplique rien.
        const { error } = await supabase
          .from('evenement')
          .upsert(lignes, { onConflict: 'id', ignoreDuplicates: true })
        if (error) {
          await incrementerTentatives(aEnvoyer.map((e) => e.id))
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
        .limit(PLAFOND_JOURNAL)
      if (error) throw error

      // `limit` protège la mémoire de l'appareil, mais tronque le
      // journal local : une voiture entrée avant la fenêtre
      // disparaîtrait de la liste alors qu'elle est toujours garée.
      // Tant que ça n'arrive pas, autant le savoir plutôt que de le
      // découvrir sur un compteur qui a maigri tout seul.
      const lignesServeur = (data ?? []) as Evenement[]
      const tronque = lignesServeur.length >= PLAFOND_JOURNAL

      await remplacerJournal(lignesServeur)
      await rafraichirDepuisLocal()
      setReseau('en-ligne')
      setRefus(null)
      // Posé APRÈS la remise à zéro, sinon il serait effacé dans la
      // foulée par le setErreur(null) qui suivait.
      setErreur(
        tronque
          ? `Le journal dépasse ${PLAFOND_JOURNAL} événements : la liste affichée peut être incomplète. Signalez-le.`
          : null
      )
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
      let session = data.session
      // Les claims sont dans le JETON, pas dans session.user — voir
      // l'en-tête de lib/jeton.ts. Les lire au mauvais endroit rendait
      // toute saisie impossible.
      let { etablissementId, role } = claimsDuJeton(session?.access_token)

      /**
       * Un jeton émis AVANT le rattachement du compte ne porte pas le
       * claim, et reste valable jusqu'à une heure. Sans cette relance,
       * la personne verrait « compte non rattaché » sans rien pouvoir
       * y faire, alors que la base est correcte — et le seul remède
       * serait de se déconnecter, ce que rien à l'écran ne suggère.
       */
      if (session && !etablissementId) {
        const { data: rafraichie } = await supabase.auth.refreshSession()
        if (rafraichie.session) {
          session = rafraichie.session
          ;({ etablissementId, role } = claimsDuJeton(session.access_token))
        }
      }

      if (!vivant) return

      if (session?.user && etablissementId) {
        setIdentite({
          etablissementId,
          userId: session.user.id,
          // Le rôle vient du même claim que celui sur lequel le RLS
          // s'appuie côté base. L'écran des réglages ne fait que
          // refléter cette décision, il ne la prend pas.
          role: role ?? 'reception',
        })
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

  /**
   * Dès que la fenêtre d'annulation d'une sortie expire, on synchronise.
   * Sans ça la sortie attendrait le rattrapage périodique, et resterait
   * jusqu'à une minute en « en attente » alors que le réseau est là.
   */
  useEffect(() => {
    if (retenueMs === null) return
    const t = setTimeout(() => {
      if (navigator.onLine) void synchroniser()
    }, retenueMs + 250)
    return () => clearTimeout(t)
  }, [retenueMs, synchroniser])

  const ecrire = useCallback(
    async (
      type: TypeEvenement,
      plaqueSaisie: string,
      chambre: string | null,
      retenirMs = 0
    ) => {
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
      await enfiler(evenement, retenirMs)
      await rafraichirDepuisLocal()
      // Un événement retenu ne partirait pas de toute façon ; on évite
      // l'aller-retour inutile et on repassera à l'expiration.
      if (!retenirMs) void synchroniser()
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

  /**
   * Une sortie est retenue le temps de la fenêtre d'annulation. Le
   * véhicule disparaît de la liste immédiatement — c'est le geste au
   * comptoir —, mais l'événement reste retirable tant qu'il n'est pas
   * parti. Sans cette retenue, l'annulation était décorative.
   */
  const sortir = useCallback(
    async (plaque: string) => {
      const present = projeter(evenements).find((v) => v.plaque === plaque)
      return ecrire('SORTIE', present?.plaque_saisie ?? plaque, null, DELAI_ANNULATION)
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
