/**
 * Réglages de l'établissement.
 *
 * v1 : un seul hôtel, donc en dur dans le code. Pas d'écran
 * d'administration (CLAUDE.md § 8 et § 10).
 *
 * Le jour du deuxième hôtel, ces valeurs viennent de la table
 * `etablissement` — la forme de l'objet ne change pas, seule la source.
 * C'est pourquoi tout le reste du code lit `config`, jamais des
 * constantes éparpillées.
 */
export type ConfigEtablissement = {
  nom: string
  places: number
  chambreObligatoire: boolean
  /** Affiché à l'utilisatrice ; la purge réelle vit dans pg_cron. */
  conservationJours: number
  /**
   * Le compteur d'occupation ne vaut que si le registre est complet.
   * Si la réception n'est pas tenue en permanence, mettre `false` :
   * un chiffre faux est pire que pas de chiffre (CLAUDE.md § 11).
   */
  afficherOccupation: boolean
}

export const config: ConfigEtablissement = {
  nom: 'Hôtel — Parking',
  places: 18,
  chambreObligatoire: false,
  conservationJours: 90,
  afficherOccupation: true,
}

/** Fenêtre d'annulation après une sortie, en millisecondes. */
export const DELAI_ANNULATION = 6000
