/**
 * Réglages de l'établissement, tels qu'ils vivent en base.
 *
 * L'application les LIT, elle ne les écrit jamais : il n'y a pas
 * d'écran d'administration (CLAUDE.md § 8 et § 10). L'endroit où on les
 * change est le Table Editor de Supabase, et un changement est visible
 * au prochain chargement — sans redéploiement.
 */
export type Etablissement = {
  id: string
  nom: string
  places: number
  chambre_obligatoire: boolean
  conservation_jours: number
  fuseau: string
  /** false quand la réception n'est pas tenue en permanence. */
  afficher_occupation: boolean
}

export type TypeEvenement = 'ENTREE' | 'SORTIE'

/** Une ligne du journal. `id` est généré côté client : le rejeu est idempotent. */
export type Evenement = {
  id: string
  etablissement_id: string
  type: TypeEvenement
  /** Normalisée : [A-Z0-9] uniquement. C'est la clé d'identité d'une voiture. */
  plaque: string
  /** Telle que tapée par l'humain, pour l'affichage. */
  plaque_saisie: string
  chambre: string | null
  /** Heure réelle du geste. Peut être passée si la saisie était hors-ligne. */
  survenu_le: string
  auteur: string | null
}

/**
 * Événement pas encore accepté par le serveur.
 *
 * Ces deux champs sont LOCAUX : ils ne correspondent à aucune colonne
 * et sont retirés avant l'envoi.
 */
export type EvenementEnAttente = Evenement & {
  /** Nombre de tentatives d'envoi. */
  tentatives: number
  /**
   * Ne pas envoyer avant cette heure (ISO). C'est ce qui rend
   * l'annulation possible : tant que la sortie n'est pas partie, on
   * peut la retirer de la file. Sans cette retenue, la synchronisation
   * l'expédie en quelques centaines de millisecondes et le bouton
   * « Annuler » n'annule plus rien, alors qu'il s'affiche six secondes.
   */
  retenu_jusqu?: string
}

/** Projection du journal : ce qui est garé maintenant. */
export type VehiculePresent = {
  plaque: string
  plaque_saisie: string
  chambre: string | null
  entree_le: string
  /**
   * L'événement qui met ce véhicule sur le parking n'a pas encore été
   * accepté par le serveur. La voiture est bien au registre — c'est le
   * serveur qui ne le sait pas encore.
   */
  enAttente: boolean
}

/**
 * `hors-ligne` : le serveur est injoignable. État NORMAL dans un hôtel,
 *   la file rejouera toute seule. On le dit sans inquiéter.
 *
 * `refuse` : le serveur a répondu, et il a dit non. Ce n'est pas une
 *   coupure réseau, ça ne se répare pas tout seul, et la file ne
 *   partira jamais tant que la cause n'est pas corrigée. Les seuls
 *   exemplaires des enregistrements sont alors sur CET appareil.
 *   Doit être bruyant.
 */
export type EtatReseau = 'en-ligne' | 'hors-ligne' | 'synchronisation' | 'refuse'
