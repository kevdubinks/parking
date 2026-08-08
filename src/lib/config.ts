import type { Etablissement } from './types'

/**
 * Valeurs de repli, et RIEN D'AUTRE.
 *
 * Les réglages réels vivent dans la table `etablissement` et sont lus
 * au chargement, puis mis en cache pour l'usage hors ligne. On les
 * change dans le Table Editor de Supabase ; c'est visible au prochain
 * chargement, sans redéploiement et sans toucher au code.
 *
 * Ce qui suit ne s'affiche que pendant les quelques centaines de
 * millisecondes qui précèdent la première lecture, ou si un poste
 * n'a jamais réussi à lire la base une seule fois. Les valeurs sont
 * donc choisies pour être neutres, pas pour être plausibles :
 *
 *   - `places` à 0 et `afficher_occupation` à false : mieux vaut ne pas
 *     afficher de compteur que d'en afficher un faux. Un « 5 / 18 »
 *     inventé serait cru ;
 *   - `chambre_obligatoire` à false : on ne bloque jamais une saisie
 *     sur une règle qu'on n'a pas encore lue.
 *
 * Il n'y a volontairement pas d'écran d'administration dans
 * l'application : c'est l'endroit où les produits gonflent et meurent
 * (CLAUDE.md § 10).
 */
export const REPLI: Etablissement = {
  id: '',
  nom: 'Parking',
  places: 0,
  chambre_obligatoire: false,
  conservation_jours: 90,
  fuseau: 'Europe/Paris',
  afficher_occupation: false,
}

/** Fenêtre d'annulation après une sortie, en millisecondes. */
export const DELAI_ANNULATION = 6000
