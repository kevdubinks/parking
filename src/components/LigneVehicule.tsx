'use client'

import { afficher, dureeDepuis, estFrancaise, heureCourte } from '@/lib/plaque'
import type { VehiculePresent } from '@/lib/types'
import styles from './registre.module.css'

/**
 * Une voiture garée. Dense à dessein : on doit en voir dix sans faire
 * défiler. Le bouton Sortie est le seul geste possible ici.
 *
 * Note : tout le texte passe par JSX, jamais par innerHTML. Une plaque
 * et un numéro de chambre sont du texte libre saisi par un humain, donc
 * une entrée non fiable (CLAUDE.md § 6).
 */
export function LigneVehicule({
  vehicule,
  onSortie,
}: {
  vehicule: VehiculePresent
  onSortie: (plaque: string) => void
}) {
  const libelle = afficher(vehicule.plaque, vehicule.plaque_saisie)

  return (
    <div className={styles.ligne}>
      <div className={styles.plaque}>
        <div className={styles.bande} aria-hidden="true">
          {estFrancaise(vehicule.plaque) ? 'F' : ''}
        </div>
        <div className={styles.numero}>{libelle}</div>
      </div>

      <div className={styles.meta}>
        <div className={styles.chambre}>
          {vehicule.chambre ? (
            `Chambre ${vehicule.chambre}`
          ) : (
            /* Signalé, jamais bloqué ni traité comme une faute. */
            <span className={styles.sansChambre}>Sans chambre</span>
          )}
        </div>
        <div className={styles.duree}>
          Entrée {heureCourte(vehicule.entree_le)} · {dureeDepuis(vehicule.entree_le)}
        </div>
      </div>

      <button
        type="button"
        className={styles.sortie}
        onClick={() => onSortie(vehicule.plaque)}
      >
        Sortie
        <span className="lecteur-seul"> de {libelle}</span>
      </button>
    </div>
  )
}
