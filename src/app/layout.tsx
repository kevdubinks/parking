import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { DIRECTION } from '@/lib/charte'
import './globals.css'

/**
 * Polices.
 *
 * `next/font` les télécharge au BUILD et les sert depuis notre propre
 * domaine : aucune requête vers un CDN à l'exécution, donc la police
 * ne peut pas devenir un point de défaillance quand le réseau de
 * l'hôtel tombe. `display: swap` fait le reste — la pile système
 * s'affiche immédiatement, la police prend le relais si elle arrive.
 *
 * Les deux directions sont déclarées ; seule celle qui est active pose
 * sa variable sur <html>. Les @font-face de l'autre restent dans le
 * bundle CSS sans être référencées, donc sans être téléchargées.
 */
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--police-archivo',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--police-plex-sans',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--police-plex-mono',
})

const policesActives =
  DIRECTION === 'signaletique'
    ? archivo.variable
    : `${plexSans.variable} ${plexMono.variable}`

export const metadata: Metadata = {
  title: 'Parking — Registre',
  description: "Registre des véhicules du parking de l'hôtel",
  // Pas d'indexation : un registre de plaques n'a rien à faire dans un
  // moteur de recherche.
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icone.svg', type: 'image/svg+xml' },
      { url: '/icone-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  // iOS ignore le manifeste : sans ces deux-là, « Sur l'écran d'accueil »
  // crée un simple marque-page qui rouvre Safari, barre d'adresse
  // comprise.
  appleWebApp: {
    capable: true,
    title: 'Parking',
    statusBarStyle: 'default',
  },
  other: {
    // Next n'émet que `mobile-web-app-capable`, le nom standard récent.
    // Les iOS antérieurs à 17 ne connaissent que celui d'Apple : sans
    // lui, le raccourci rouvre Safari avec sa barre d'adresse au lieu
    // de s'ouvrir en plein écran. Le téléphone d'une réception n'est
    // pas forcément neuf ; la balise ne coûte rien.
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le champ plaque est en très grande taille : pas besoin de zoomer,
  // et le zoom automatique d'iOS au focus décale l'écran en pleine
  // saisie.
  maximumScale: 1,
  // Sous l'encoche et derrière la barre de gestes, une fois lancé
  // depuis l'écran d'accueil.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#12459E' },
    { media: '(prefers-color-scheme: dark)', color: '#14161A' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={policesActives}>
      <body>{children}</body>
    </html>
  )
}
