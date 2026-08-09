#!/usr/bin/env node
/**
 * Génère les icônes du raccourci écran d'accueil.
 *
 *   npm run icones
 *
 * Une icône de raccourci est vue à 48 px sur un écran d'accueil chargé,
 * du coin de l'œil, par quelqu'un qui cherche à ouvrir l'outil vite.
 * Elle n'a donc qu'un travail : être reconnaissable à cette taille. D'où
 * une plaque stylisée — bande bleue à gauche, champ clair, un P — et
 * rien d'autre. Pas de dégradé, pas de texte fin, pas de détail qui
 * disparaît sous 64 px.
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
 * `pleine` : l'icône touche les bords, pour les gabarits « maskable »
 * d'Android qui rognent en cercle. Sinon on garde une marge.
 */
const dessin = (taille, pleine = false) => {
  const m = pleine ? 0 : Math.round(taille * 0.08)
  const c = taille - m * 2
  // Proportions d'une plaque : large et basse.
  const h = Math.round(c * 0.46)
  const y = m + Math.round((c - h) / 2)
  const bande = Math.round(c * 0.17)
  const r = Math.round(c * 0.05)

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
  <rect width="${taille}" height="${taille}" fill="${ENCRE}"/>
  <g>
    <rect x="${m}" y="${y}" width="${c}" height="${h}" rx="${r}" fill="${PLAQUE}"/>
    <path d="M${m} ${y + r} a${r} ${r} 0 0 1 ${r} -${r} h${bande - r} v${h} h-${bande - r} a${r} ${r} 0 0 1 -${r} -${r} z" fill="${BLEU}"/>
    <text x="${m + bande + (c - bande) / 2}" y="${y + h * 0.5}"
          font-family="Archivo, Helvetica, Arial, sans-serif" font-weight="700"
          font-size="${Math.round(h * 0.72)}" fill="${ENCRE}"
          text-anchor="middle" dominant-baseline="central">P</text>
  </g>
</svg>`)
}

await mkdir(sortie, { recursive: true })

const fichiers = [
  { nom: 'icone-192.png', taille: 192 },
  { nom: 'icone-512.png', taille: 512 },
  // iOS ignore le manifeste et rogne lui-même les coins : pas de marge,
  // et surtout pas de transparence, qu'il rendrait en noir.
  { nom: 'apple-touch-icon.png', taille: 180, pleine: true },
  { nom: 'icone-maskable-512.png', taille: 512, pleine: true },
]

for (const f of fichiers) {
  await sharp(dessin(f.taille, f.pleine)).png().toFile(join(sortie, f.nom))
  console.log(`   ✔ public/${f.nom}`)
}

// Favicon d'onglet, utile aussi dans la liste des raccourcis.
await writeFile(join(sortie, 'icone.svg'), dessin(512).toString('utf8'))
console.log('   ✔ public/icone.svg')
