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

/** Événement pas encore accepté par le serveur. */
export type EvenementEnAttente = Evenement & {
  /** Nombre de tentatives d'envoi. Sert à espacer les rejeux. */
  tentatives: number
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
