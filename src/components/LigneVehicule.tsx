'use client'

import { afficher, dureeDepuis } from '@/lib/plaque'
import type { VehiculePresent } from '@/lib/types'
import styles from './registre.module.css'

/**
 * Une voiture garée. 56 px, un filet, aucun fond, aucune ombre : huit à
 * dix lignes tiennent dans un écran de téléphone. La cible « Sortie »
 * fait 88 × 44 px et reste à droite, loin du pouce qui frappe Entrée.
 *
 * Note : tout le texte passe par JSX, jamais par innerHTML. Une plaque
 * et un numéro de chambre sont du texte libre saisi par un humain, donc
 * une entrée non fiable (CLAUDE.md § 6).
 */
export function LigneVehicule({
  vehicule,
  marquee,
  onSortie,
}: {
  vehicule: VehiculePresent
  /** La plaque en cours de saisie est déjà celle-ci : ligne signalée. */
  marquee: boolean
  onSortie: (plaque: string) => void
}) {
  const libelle = afficher(vehicule.plaque, vehicule.plaque_saisie)

  return (
    <div
      className={`${styles.ligne} ${marquee ? styles.ligneMarquee : ''}`}
      aria-current={marquee ? 'true' : undefined}
    >
      <div>
        <div className={styles.plaque}>{libelle}</div>

        {vehicule.chambre && !vehicule.enAttente ? (
          <div className={styles.chambre}>Chambre {vehicule.chambre}</div>
        ) : (
          <div className={styles.marqueurs}>
            {vehicule.chambre ? (
              <span className={styles.chambre}>Chambre {vehicule.chambre}</span>
            ) : (
              /* Le mot est écrit : la couleur ne porte rien seule. */
              <span className={styles.sansChambre} title="aucune chambre attribuée">
                sans chambre
              </span>
            )}
            {vehicule.enAttente && (
              <span
                className={styles.enAttente}
                title="enregistré sur l'appareil, pas encore envoyé au serveur"
              >
                en attente
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.duree}>{dureeDepuis(vehicule.entree_le)}</div>

      {/* Reste actif même en attente d'envoi : hors ligne, on travaille
          comme en ligne. */}
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
