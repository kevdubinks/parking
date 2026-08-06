import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieAPoser = { name: string; value: string; options: CookieOptions }

/**
 * Client serveur (composants serveur, route handlers).
 * Clé anon uniquement : la clé service_role ne doit apparaître dans
 * aucun chemin déclenché par une requête utilisateur (CLAUDE.md § 6).
 */
export async function supabaseServeur() {
  const jar = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (aPoser: CookieAPoser[]) => {
          try {
            aPoser.forEach(({ name, value, options }) => jar.set(name, value, options))
          } catch {
            // Appelé depuis un composant serveur : le middleware
            // rafraîchit déjà la session, on peut ignorer.
          }
        },
      },
    }
  )
}
