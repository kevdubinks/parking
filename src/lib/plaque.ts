/**
 * Plaques d'immatriculation.
 *
 * Deux règles, une seule fois, ici :
 *
 * 1. NORMALISATION — on stocke [A-Z0-9]. `AB-123-CD`, `ab 123 cd` et
 *    `AB123CD` sont la même voiture. La saisie brute est conservée à
 *    part pour l'affichage.
 *
 * 2. VALIDATION PERMISSIVE — en Corse au mois d'août, la moitié du
 *    parking n'est pas française. On refuse ce qui ne peut être une
 *    plaque nulle part, rien de plus. Une plaque italienne, allemande
 *    ou sénégalaise doit passer sans discussion.
 */

export const LONGUEUR_MIN = 4
export const LONGUEUR_MAX = 12

export function normaliser(saisie: string): string {
  return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function estValide(plaqueNormalisee: string): boolean {
  return (
    plaqueNormalisee.length >= LONGUEUR_MIN &&
    plaqueNormalisee.length <= LONGUEUR_MAX &&
    /^[A-Z0-9]+$/.test(plaqueNormalisee)
  )
}

/** Format français AB-123-CD, le seul qu'on se permette d'embellir. */
const FR = /^([A-Z]{2})(\d{3})([A-Z]{2})$/

export function estFrancaise(plaqueNormalisee: string): boolean {
  return FR.test(plaqueNormalisee)
}

/**
 * Affichage. On préfère la saisie d'origine quand elle existe : c'est
 * elle que l'humain reconnaîtra sur le pare-brise. Sinon on met en forme
 * le format français, et on laisse tout le reste tel quel — inventer une
 * ponctuation sur une plaque étrangère la rend moins reconnaissable, pas
 * plus.
 */
export function afficher(plaqueNormalisee: string, plaqueSaisie?: string | null): string {
  if (plaqueSaisie && normaliser(plaqueSaisie) === plaqueNormalisee) {
    return plaqueSaisie.toUpperCase().trim()
  }
  const m = plaqueNormalisee.match(FR)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : plaqueNormalisee
}

/**
 * Durée de stationnement en clair. Pas de secondes : personne au
 * comptoir n'en a l'usage.
 */
export function dureeDepuis(iso: string, maintenant = Date.now()): string {
  const minutes = Math.max(0, Math.floor((maintenant - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `${heures} h ${String(minutes % 60).padStart(2, '0')}`
  const jours = Math.floor(heures / 24)
  return `${jours} j ${heures % 24} h`
}

export function heureCourte(iso: string, fuseau = 'Europe/Paris'): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: fuseau,
  })
}
