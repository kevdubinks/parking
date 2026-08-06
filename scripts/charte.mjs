#!/usr/bin/env node
/**
 * Bascule de direction graphique.
 *
 *   npm run charte              affiche la direction active
 *   npm run charte -- poste-de-nuit
 *
 * Deux fichiers doivent rester d'accord : l'@import de tokens.css
 * (palette, typo, densités) et la constante de charte.ts (police
 * auto-hébergée au build). Les modifier à la main, c'est en oublier un.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS = join(racine, 'src/styles/tokens.css')
const CHARTE = join(racine, 'src/lib/charte.ts')

const DIRECTIONS = {
  signaletique: 'tokens-signaletique.css',
  'poste-de-nuit': 'tokens-poste-de-nuit.css',
}

const IMPORT = /@import\s+'\.\/(tokens-[a-z-]+\.css)';/
const CONST = /export const DIRECTION: Direction = '([a-z-]+)'/

const [, , demandee] = process.argv

const tokens = await readFile(TOKENS, 'utf8')
const charte = await readFile(CHARTE, 'utf8')

const actuelle = Object.entries(DIRECTIONS).find(
  ([, fichier]) => fichier === tokens.match(IMPORT)?.[1]
)?.[0]

if (!demandee) {
  console.log(`Direction active : ${actuelle ?? 'inconnue'}`)
  console.log(`Disponibles      : ${Object.keys(DIRECTIONS).join(', ')}`)
  process.exit(0)
}

if (!(demandee in DIRECTIONS)) {
  console.error(`Direction inconnue : ${demandee}`)
  console.error(`Attendu : ${Object.keys(DIRECTIONS).join(' | ')}`)
  process.exit(1)
}

const tokensMaj = tokens.replace(IMPORT, `@import './${DIRECTIONS[demandee]}';`)
const charteMaj = charte.replace(CONST, `export const DIRECTION: Direction = '${demandee}'`)

if (!IMPORT.test(tokens) || !CONST.test(charte)) {
  console.error("Les marqueurs attendus sont introuvables : rien n'a été écrit.")
  process.exit(1)
}

await writeFile(TOKENS, tokensMaj)
await writeFile(CHARTE, charteMaj)

console.log(`Direction : ${actuelle ?? '?'} → ${demandee}`)
console.log('Relancez le serveur de développement pour recharger la police.')
