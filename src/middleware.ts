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

  const versConnexion = requete.nextUrl.pathname === '/connexion'

  /**
   * Une redirection crée une réponse NEUVE : les cookies de session
   * rafraîchis par `setAll` ci-dessus vivent sur `reponse` et seraient
   * perdus. Le navigateur renverrait alors l'ancien jeton, qui sera
   * rafraîchi à nouveau, et ainsi de suite — jusqu'à ce qu'il expire
   * pour de bon et que le registre se vide sans explication.
   */
  const rediriger = (chemin: string) => {
    const url = requete.nextUrl.clone()
    url.pathname = chemin
    url.search = ''
    const redirection = NextResponse.redirect(url)
    reponse.cookies.getAll().forEach((c) => redirection.cookies.set(c))
    return redirection
  }

  if (!user && !versConnexion) return rediriger('/connexion')
  if (user && versConnexion) return rediriger('/')

  return reponse
}

/**
 * Le filtre doit laisser passer les fichiers statiques SANS session.
 *
 * `manifest.webmanifest` en particulier : il est demandé par le
 * navigateur depuis l'écran de connexion, donc sans session. Redirigé
 * vers /connexion, il renvoyait du HTML au lieu du manifeste, et
 * « Ajouter à l'écran d'accueil » produisait un marque-page sans nom,
 * sans icône et sans mode plein écran — en silence, puisque rien
 * n'échoue visiblement.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|manifest.webmanifest|robots.txt|sitemap.xml|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|webmanifest)$).*)',
  ],
}
