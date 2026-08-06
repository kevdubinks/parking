'use client'

import styles from './registre.module.css'

/**
 * Une case par place, jamais une barre continue : on compte les places
 * libres du regard, sans convertir un pourcentage en nombre de voitures.
 *
 * Complet passe au noir et non au rouge — « complet » n'est pas une
 * panne. Le mot est écrit à côté ; la couleur ne porte rien seule.
 *
 * Au-delà d'une trentaine de places les cases deviennent des traits
 * illisibles : on retombe alors sur une barre de remplissage, ce qui
 * est un moindre mal que trente traits de 2 px.
 */
const MAX_CASES = 30

export function Jauge({ occupees, places }: { occupees: number; places: number }) {
  const complet = occupees >= places

  if (places > MAX_CASES) {
    const part = Math.min(100, Math.round((occupees / places) * 100))
    return (
      <div className={styles.jauge} aria-hidden="true">
        <div className={styles.case} style={{ flex: part }}>
          <div
            className={complet ? styles.caseComplet : styles.caseOccupee}
            style={{ height: '100%' }}
          />
        </div>
        {part < 100 && <div className={styles.case} style={{ flex: 100 - part }} />}
      </div>
    )
  }

  return (
    <div className={styles.jauge} aria-hidden="true">
      {Array.from({ length: places }, (_, i) => (
        <div
          key={i}
          className={`${styles.case} ${
            i < occupees ? (complet ? styles.caseComplet : styles.caseOccupee) : ''
          }`}
        />
      ))}
    </div>
  )
}
