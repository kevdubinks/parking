/**
 * Vérification des variables d'environnement, avant tout le reste.
 *
 * Sans elles, la construction échoue de toute façon — mais deux minutes
 * plus tard, au moment de prérendre une page, sur un message de la
 * bibliothèque Supabase qui ne dit ni quelle variable manque, ni où la
 * poser :
 *
 *   Error: @supabase/ssr: Your project's URL and API key are required
 *   Error occurred prerendering page "/connexion"
 *
 * Quelqu'un qui installe l'outil pour la première fois n'a aucune
 * chance de traduire ça en « il manque deux variables dans Vercel ».
 * On échoue donc immédiatement, en le disant.
 */
const REQUISES = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const manquantes = REQUISES.filter((v) => !process.env[v])

if (manquantes.length) {
  throw new Error(
    `\n\n  Variable(s) d'environnement manquante(s) : ${manquantes.join(', ')}\n\n` +
      `  En local   : copier .env.example en .env.local et les remplir.\n` +
      `  Sur Vercel : Settings → Environment Variables, sur Production,\n` +
      `               Preview et Development, puis redéployer.\n\n` +
      `  Les valeurs sont dans Supabase → Settings → API :\n` +
      `    NEXT_PUBLIC_SUPABASE_URL       l'URL du projet\n` +
      `    NEXT_PUBLIC_SUPABASE_ANON_KEY  la clé PUBLIABLE (sb_publishable_…),\n` +
      `                                   surtout pas la clé secrète.\n\n` +
      `  Ces variables sont figées dans le bundle au moment du build :\n` +
      `  les ajouter après coup impose un redéploiement.\n`
  )
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('sb_secret_')) {
  throw new Error(
    `\n\n  NEXT_PUBLIC_SUPABASE_ANON_KEY contient une clé SECRÈTE.\n\n` +
      `  Tout ce qui est préfixé NEXT_PUBLIC_ part dans le navigateur.\n` +
      `  Cette clé contourne le RLS sur l'ensemble du projet : elle donnerait\n` +
      `  à n'importe quel visiteur la lecture et l'écriture sur tous les\n` +
      `  établissements. Utiliser la clé publiable (sb_publishable_…).\n`
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Le RGPD interdit d'écrire une plaque dans les logs applicatifs.
  // On coupe aussi les en-têtes qui pourraient fuiter en clair.
  poweredByHeader: false,

  async headers() {
    /**
     * Politique de sécurité du contenu.
     *
     * `connect-src` est la ligne qui compte ici : même si un script
     * étranger parvenait à s'exécuter, il ne pourrait envoyer les
     * plaques nulle part ailleurs que vers Supabase. L'origine est lue
     * dans l'environnement, jamais écrite en dur.
     *
     * `unsafe-inline` sur les scripts est une concession à Next, qui
     * injecte ses données d'hydratation en ligne. La politique garde
     * tout son intérêt : elle interdit de CHARGER un script d'une autre
     * origine, et d'exfiltrer vers une autre destination.
     *
     * `unsafe-eval` uniquement en développement, pour le rechargement
     * à chaud.
     */
    const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    const dev = process.env.NODE_ENV === 'development'

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${supabase} ${supabase.replace('https://', 'wss://')}`,
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Aucune de ces capacités n'est utilisée par un registre de
          // plaques. Les refuser coûte une ligne.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
