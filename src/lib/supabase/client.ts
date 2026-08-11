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

/*
 * La lecture des claims a déménagé dans lib/jeton.ts : module pur,
 * testable sans navigateur, et surtout UTILISÉ. La version qui vivait
 * ici était correcte et n'a jamais été appelée — pendant ce temps le
 * reste du code lisait `session.user.app_metadata`, qui ne contient
 * pas les claims du hook.
 */
