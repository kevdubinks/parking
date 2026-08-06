'use client'

import styles from './registre.module.css'

/**
 * Fenêtre d'annulation après une sortie.
 *
 * Elle existe pour une raison précise : une sortie enregistrée par
 * erreur ne doit pas obliger à re-saisir la plaque au comptoir, ni
 * pousser à effacer une ligne du journal. Passé le délai, la correction
 * se fait par un nouvel événement.
 */
export function BarreAnnulation({
  texte,
  visible,
  onAnnuler,
}: {
  texte: string
  visible: boolean
  onAnnuler: () => void
}) {
  return (
    <div
      className={`${styles.annulation} ${visible ? styles.annulationVisible : ''}`}
      role="status"
      aria-live="polite"
      /* Retiré de l'ordre de tabulation quand la barre est cachée :
         sinon le focus part sur un bouton invisible. */
      aria-hidden={!visible}
    >
      <span>{texte}</span>
      <button type="button" onClick={onAnnuler} tabIndex={visible ? 0 : -1}>
        Annuler
      </button>
    </div>
  )
}
