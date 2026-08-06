'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabaseNavigateur } from './supabase/client'
import {
  confirmer,
  enfiler,
  incrementerTentatives,
  lireAttente,
  lireJournal,
  projeter,
  remplacerJournal,
  retirerDeLaFile,
} from './journal'
import type { Evenement, EtatReseau, TypeEvenement, VehiculePresent } from './types'
import { normaliser } from './plaque'

const COLONNES = 'id,etablissement_id,type,plaque,plaque_saisie,chambre,survenu_le,auteur'

/** Identité tirée du jeton — jamais du corps d'une requête. */
type Identite = { etablissementId: string; userId: string }

export type Registre = {
  pret: boolean
  identite: Identite | null
  presents: VehiculePresent[]
  enAttente: number
  reseau: EtatReseau
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
  const [erreur, setErreur] = useState<string | null>(null)
  const syncEnCours = useRef(false)

  /** Recalcule l'état affiché depuis le local. Aucune requête réseau. */
  const rafraichirDepuisLocal = useCallback(async () => {
    const [journal, attente] = await Promise.all([lireJournal(), lireAttente()])
    setEvenements([...journal, ...attente])
    setIdsEnAttente(new Set(attente.map((e) => e.id)))
  }, [])

  /** Pousse la file, puis relit le serveur. Silencieux si hors-ligne. */
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

      const { data, error } = await supabase
        .from('evenement')
        .select(COLONNES)
        .order('survenu_le', { ascending: false })
        .limit(5000)
      if (error) throw error

      await remplacerJournal((data ?? []) as Evenement[])
      await rafraichirDepuisLocal()
      setReseau('en-ligne')
      setErreur(null)
    } catch {
      // Pas de message d'erreur à l'écran : hors-ligne est un état
      // normal, pas une panne. Le bandeau suffit.
      setReseau(navigator.onLine ? 'en-ligne' : 'hors-ligne')
      await rafraichirDepuisLocal()
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
    const revenu = () => {
      setReseau('en-ligne')
      void synchroniser()
    }
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
    presents,
    enAttente: idsEnAttente.size,
    reseau,
    erreur,
    entrer,
    sortir,
    annulerSortie,
    synchroniser,
  }
}
