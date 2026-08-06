'use client'

import { useEffect, useState } from 'react'
import styles from './registre.module.css'

/**
 * Fenêtre d'annulation après une sortie.
 *
 * Elle existe pour une raison précise : une sortie enregistrée par
 * erreur ne doit pas obliger à re-saisir la plaque au comptoir, ni
 * pousser à effacer une ligne du journal. Passé le délai, la correction
 * se fait par un nouvel événement.
 *
 * Le décompte est un chiffre lisible autant qu'un filet — sous
 * `prefers-reduced-motion`, le filet avance par pas d'une seconde au
 * lieu de glisser (les durées de transition sont mises à zéro dans les
 * tokens), et le chiffre reste.
 *
 * Elle s'insère au-dessus de la saisie et pousse la liste : jamais elle
 * ne recouvre le champ.
 */
export function BarreAnnulation({
  plaque,
  debut,
  duree,
  onAnnuler,
}: {
  plaque: string
  /** Horodatage du début de la fenêtre, en millisecondes. */
  debut: number
  duree: number
  onAnnuler: () => void
}) {
  const [restant, setRestant] = useState(duree)

  useEffect(() => {
    setRestant(duree)
    const t = setInterval(() => {
      setRestant(Math.max(0, duree - (Date.now() - debut)))
    }, 250)
    return () => clearInterval(t)
  }, [debut, duree])

  const secondes = Math.ceil(restant / 1000)

  return (
    <div className={styles.annulation} role="status" aria-live="polite">
      <div className={styles.annulationHaut}>
        <div className={styles.annulationTexte}>
          Sortie enregistrée — <span className={styles.annulationPlaque}>{plaque}</span>
        </div>
        <div className={styles.annulationCompte}>
          {secondes}&nbsp;s
        </div>
        <button type="button" className={styles.annulationBouton} onClick={onAnnuler}>
          Annuler
          <span className="lecteur-seul"> la sortie de {plaque}</span>
        </button>
      </div>
      <div className={styles.annulationFilet} aria-hidden="true">
        <span style={{ width: `${(restant / duree) * 100}%` }} />
      </div>
    </div>
  )
}
