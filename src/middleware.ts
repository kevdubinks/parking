import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieAPoser = { name: string; value: string; options: CookieOptions }

/**
 * Rafraîchit la session à chaque navigation.
 *
 * Sans ça le jeton expire au comptoir, la requête suivante ne porte plus
 * de claim `etablissement_id`, et le RLS — qui fait bien son travail —
 * renvoie une liste vide. De l'extérieur ça ressemble à « le parking
 * s'est vidé tout seul ».
 */
export async function middleware(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => requete.cookies.getAll(),
        setAll: (aPoser: CookieAPoser[]) => {
          aPoser.forEach(({ name, value }) => requete.cookies.set(name, value))
          reponse = NextResponse.next({ request: requete })
          aPoser.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const versConnexion = requete.nextUrl.pathname.startsWith('/connexion')

  if (!user && !versConnexion) {
    const url = requete.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  if (user && versConnexion) {
    const url = requete.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return reponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
