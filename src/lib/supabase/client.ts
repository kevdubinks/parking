'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Client navigateur. `supabase-js` uniquement — jamais Prisma, qui
 * contourne le RLS (CLAUDE.md § 3).
 *
 * Aucun `etablissement_id` n'est passé depuis ce client : il vient
 * toujours du claim JWT, côté base.
 */
let instance: ReturnType<typeof createBrowserClient> | null = null

export function supabaseNavigateur() {
  if (!instance) {
    instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}

/** Lit l'établissement depuis le jeton, sans faire de requête. */
export function etablissementDuJeton(accessToken: string | undefined): string | null {
  if (!accessToken) return null
  try {
    const charge = JSON.parse(
      atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    )
    return charge?.app_metadata?.etablissement_id ?? null
  } catch {
    return null
  }
}
