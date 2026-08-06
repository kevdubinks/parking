import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parking — Registre',
  description: "Registre des véhicules du parking de l'hôtel",
  // Pas d'indexation : un registre de plaques n'a rien à faire dans un
  // moteur de recherche.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le champ plaque est en grande taille : pas besoin de zoomer, et le
  // zoom automatique d'iOS au focus décale l'écran en pleine saisie.
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
