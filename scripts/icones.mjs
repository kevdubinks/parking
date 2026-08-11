#!/usr/bin/env node
/**
 * Génère les icônes du raccourci écran d'accueil.
 *
 *   npm run icones
 *
 * Une icône de raccourci est vue à 48 px sur un écran d'accueil chargé,
 * du coin de l'œil, par quelqu'un qui cherche à ouvrir l'outil vite.
 * Elle n'a qu'un travail : être reconnaissable à cette taille. D'où une
 * plaque stylisée — bande bleue à gauche, champ clair, un P — et rien
 * d'autre.
 *
 * Deux règles que la première version enfreignait :
 *
 * 1. AUCUNE POLICE. Le « P » était un élément <text>, rendu par la
 *    police que la machine de génération avait sous la main. Regénérer
 *    ailleurs — autre poste, intégration continue — pouvait produire
 *    une lettre différente, ou rien du tout si le moteur de rendu ne
 *    gère pas <text>. Le P est maintenant un tracé.
 *
 * 2. ZONE DE SÉCURITÉ des icônes « maskable ». Android rogne l'icône
 *    selon la forme du lanceur — cercle, squircle, goutte. Seul le
 *    disque central de 80 % est garanti visible. La version pleine
 *    bord faisait donc raboter les extrémités de la plaque, dont la
 *    bande bleue qui est l'élément distinctif.
 *
 * Les couleurs viennent de la direction A de la charte. Si la charte
 * change, régénérer.
 */

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const sortie = join(racine, 'public')

const ENCRE = '#15171A'
const BLEU = '#12459E'
const PLAQUE = '#FFFFFF'

/**
 * Un « P » en tracé pur, dans une boîte de 0,83 × 1.
 * Deux sous-chemins et `evenodd` : le second creuse le contre-poinçon.
 */
const P = 'M0 0 H0.55 A0.28 0.28 0 0 1 0.55 0.56 H0.22 V1 H0 Z ' +
  'M0.22 0.18 H0.55 A0.10 0.10 0 0 1 0.55 0.38 H0.22 Z'
const P_LARGEUR = 0.83

/**
 * @param marge fraction du côté laissée libre de chaque côté.
 *   0,08 pour un lanceur qui n'écrête pas ; 0,14 pour « maskable »,
 *   valeur calculée pour que la plaque entière tienne dans le disque
 *   de sécurité de 80 % : (l/2)² + (0,46·l/2)² ≤ (0,4·T)² donne
 *   l ≤ 0,727·T.
 */
const dessin = (taille, marge = 0.08) => {
  const m = Math.round(taille * marge)
  const c = taille - m * 2
  // Proportions d'une plaque : large et basse.
  const h = Math.round(c * 0.46)
  const y = m + Math.round((c - h) / 2)
  const bande = Math.round(c * 0.17)
  const r = Math.round(c * 0.05)

  // Le P, centré dans la partie claire, à 62 % de la hauteur du champ.
  const hauteurP = h * 0.62
  const echelle = hauteurP
  const largeurP = P_LARGEUR * echelle
  const px = m + bande + (c - bande - largeurP) / 2
  const py = y + (h - hauteurP) / 2

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
  <rect width="${taille}" height="${taille}" fill="${ENCRE}"/>
  <clipPath id="plaque">
    <rect x="${m}" y="${y}" width="${c}" height="${h}" rx="${r}"/>
  </clipPath>
  <g clip-path="url(#plaque)">
    <rect x="${m}" y="${y}" width="${c}" height="${h}" fill="${PLAQUE}"/>
    <rect x="${m}" y="${y}" width="${bande}" height="${h}" fill="${BLEU}"/>
  </g>
  <path d="${P}" fill="${ENCRE}" fill-rule="evenodd"
        transform="translate(${px} ${py}) scale(${echelle})"/>
</svg>`)
}

await mkdir(sortie, { recursive: true })

const fichiers = [
  { nom: 'icone-192.png', taille: 192 },
  { nom: 'icone-512.png', taille: 512 },
  // iOS ignore le manifeste et applique son propre masque à coins
  // arrondis. Pas de transparence : le fond couvre toute la surface.
  { nom: 'apple-touch-icon.png', taille: 180 },
  // Zone de sécurité Android : la plaque doit tenir dans le disque
  // central de 80 %, quel que soit le masque du lanceur.
  { nom: 'icone-maskable-512.png', taille: 512, marge: 0.14 },
]

/**
 * Le coin de la plaque tient-il dans le disque de sécurité de 80 % ?
 * Vérifié plutôt que supposé : la marge se règle à la main, et une
 * valeur trop faible ne se voit qu'une fois l'icône installée sur un
 * lanceur qui rogne en cercle.
 */
function verifierZoneDeSecurite(taille, marge) {
  const m = taille * marge
  const demiLargeur = taille / 2 - m
  const demiHauteur = ((taille - 2 * m) * 0.46) / 2
  const coin = Math.hypot(demiLargeur, demiHauteur)
  const rayonSur = taille * 0.4
  return { coin: Math.round(coin), rayonSur: Math.round(rayonSur), tient: coin <= rayonSur }
}

for (const f of fichiers) {
  if (f.nom.includes('maskable')) {
    const z = verifierZoneDeSecurite(f.taille, f.marge)
    if (!z.tient) {
      console.error(
        `   ✖ ${f.nom} : le coin de la plaque est à ${z.coin} px du centre, ` +
          `au-delà du disque de sécurité de ${z.rayonSur} px. Augmentez la marge.`
      )
      process.exitCode = 1
      continue
    }
    console.log(`   · zone de sécurité : coin à ${z.coin} px, limite ${z.rayonSur} px`)
  }
  await sharp(dessin(f.taille, f.marge)).png().toFile(join(sortie, f.nom))
  console.log(`   ✔ public/${f.nom}`)
}

// Favicon d'onglet, utile aussi dans la liste des raccourcis.
await writeFile(join(sortie, 'icone.svg'), dessin(512).toString('utf8'))
console.log('   ✔ public/icone.svg')
