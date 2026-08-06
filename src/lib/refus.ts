/**
 * Distinguer « le serveur est injoignable » de « le serveur a dit non ».
 *
 * Les deux arrivent dans le même `catch`, et les confondre est un
 * défaut coûteux en exploitation : un refus serveur affiché comme une
 * coupure réseau laisse croire que ça repartira tout seul. Ça ne
 * repart pas. Les enregistrements s'empilent sur un seul appareil,
 * dans le stockage d'un navigateur, sans que personne ne soit prévenu.
 *
 * Module pur, sans React ni supabase : c'est la partie qu'il faut
 * pouvoir vérifier sans lancer l'application.
 */

/** Codes PostgREST/Postgres qu'on sait nommer en français. */
const CONNUS: Record<string, string> = {
  // Politique RLS : la ligne a été refusée par le with check.
  '42501':
    "Le serveur refuse l'écriture (politique d'accès). Le compte n'est probablement pas rattaché à un établissement, ou le hook JWT n'est pas activé.",
  // Jeton absent, invalide ou expiré.
  PGRST301: 'La session a expiré ou le jeton est invalide. Reconnectez-vous.',
  '401': 'La session a expiré ou le jeton est invalide. Reconnectez-vous.',
  // Colonne ou table absente : schéma pas à jour côté serveur.
  '42703': 'Le schéma de la base ne correspond pas à cette version de l’application.',
  '42P01': 'Le schéma de la base ne correspond pas à cette version de l’application.',
}

/**
 * Le serveur a-t-il répondu, par opposition à être injoignable ?
 *
 * PostgREST accompagne toujours ses refus d'un code. Une coupure
 * réseau produit un TypeError sans code. `enLigne` est passé plutôt
 * que lu depuis `navigator` pour que la fonction reste testable.
 */
export function estRefusServeur(e: unknown, enLigne: boolean): boolean {
  if (!enLigne) return false
  const code = (e as { code?: unknown } | null | undefined)?.code
  return typeof code === 'string' && code.length > 0
}

/**
 * Phrase à afficher. Elle s'adresse à qui a installé l'outil, pas à la
 * personne au comptoir — mais elle est visible par les deux, donc elle
 * reste en français et sans jargon inutile.
 */
export function messageRefus(e: unknown): string {
  const { code, message } = (e ?? {}) as { code?: string; message?: string }
  if (code && CONNUS[code]) return CONNUS[code]
  return `Le serveur refuse l’enregistrement (code ${code ?? '?'}${
    message ? ` — ${message}` : ''
  }).`
}

/** Le plus ancien horodatage d'une file, ou null si elle est vide. */
export function plusAncien(horodatages: readonly string[]): string | null {
  if (!horodatages.length) return null
  return horodatages.reduce((a, t) => (t < a ? t : a), horodatages[0])
}
