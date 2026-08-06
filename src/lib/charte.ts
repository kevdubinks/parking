/**
 * Direction graphique active.
 *
 * Doit rester d'accord avec l'@import de src/styles/tokens.css — les
 * deux sont réécrits ensemble par `npm run charte -- <direction>`.
 *
 * Cette constante ne sert qu'à choisir la police auto-hébergée au
 * build : tout le reste de la charte passe par les tokens CSS.
 */
export type Direction = 'signaletique' | 'poste-de-nuit'

export const DIRECTION: Direction = 'signaletique'
