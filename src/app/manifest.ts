import type { MetadataRoute } from 'next'

/**
 * Raccourci écran d'accueil.
 *
 * L'outil est ouvert plusieurs fois par jour, debout, entre deux
 * clients. Passer par le navigateur, retrouver un onglet ou taper une
 * URL coûte à chaque fois quelques secondes — exactement la monnaie
 * dans laquelle ce produit est jugé.
 *
 * `standalone` retire la barre d'adresse : l'écran gagne ~90 px de
 * hauteur utile sur téléphone, soit une ligne et demie de registre, et
 * personne ne peut naviguer ailleurs par accident.
 *
 * Volontairement pas d'`orientation` imposée : le comptoir peut être
 * une tablette posée en paysage.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Parking — Registre',
    short_name: 'Parking',
    description: "Registre des véhicules du parking de l'hôtel",
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F5F2',
    theme_color: '#12459E',
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icone-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
