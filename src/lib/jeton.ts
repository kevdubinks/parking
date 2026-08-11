/**
 * Lecture des claims du jeton d'accès.
 *
 * POURQUOI CE MODULE EXISTE — à lire avant de le « simplifier ».
 *
 * Le Custom Access Token Hook injecte `etablissement_id` et `role` dans
 * les CLAIMS DU JETON. C'est là que le RLS les lit, côté base.
 *
 * Ce n'est PAS là que supabase-js les expose. L'objet
 * `session.user.app_metadata` que renvoie la bibliothèque vient du
 * champ `raw_app_meta_data` de la table auth.users, que le hook ne
 * touche pas. Vérifié sur le projet réel :
 *
 *   claims du jeton      { etablissement_id: "ad09…", role: "direction" }
 *   session.user.app_metadata { provider: "email", providers: ["email"] }
 *
 * Lire `session.user.app_metadata.etablissement_id` renvoie donc
 * toujours undefined, l'application se croit non rattachée, et plus
 * rien ne peut être enregistré — alors que la base est parfaitement
 * configurée et que le RLS, lui, voit le claim.
 *
 * Module pur : aucune dépendance à supabase-js ni au navigateur, pour
 * qu'il soit vérifiable sans session.
 */

export type ClaimsJeton = {
  etablissementId: string | null
  role: string | null
}

const VIDE: ClaimsJeton = { etablissementId: null, role: null }

/** base64url → texte, sans dépendance : `atob` existe côté navigateur et Node ≥ 16. */
function decoderCharge(segment: string): unknown {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  // atob n'accepte pas une longueur non multiple de 4.
  const complet = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binaire = atob(complet)
  const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(octets))
}

/**
 * Ne VALIDE pas la signature, et n'a pas à le faire : l'autorité reste
 * le RLS, qui vérifie le jeton côté serveur. Ici on ne fait que
 * refléter à l'écran ce que la base appliquera de toute façon.
 */
export function claimsDuJeton(accessToken: string | null | undefined): ClaimsJeton {
  if (!accessToken) return VIDE
  const segments = accessToken.split('.')
  if (segments.length !== 3) return VIDE

  try {
    const charge = decoderCharge(segments[1]) as {
      app_metadata?: { etablissement_id?: unknown; role?: unknown }
    }
    const meta = charge?.app_metadata
    return {
      etablissementId: typeof meta?.etablissement_id === 'string' ? meta.etablissement_id : null,
      role: typeof meta?.role === 'string' ? meta.role : null,
    }
  } catch {
    // Un jeton illisible n'est pas une identité : on échoue fermé.
    return VIDE
  }
}
