#!/usr/bin/env node
/**
 * Met le site en ligne sur Vercel, sans installer quoi que ce soit.
 *
 *   VERCEL_TOKEN=… node outils/deployer-vercel.mjs
 *   node outils/deployer-vercel.mjs --essai      (ne téléverse rien)
 *
 * Le contenu de manovoyage/ est envoyé tel quel : c'est un site statique, il
 * n'y a rien à construire. On téléverse chaque fichier une fois, puis on crée
 * le déploiement à partir de leurs empreintes — Vercel garde les fichiers déjà
 * connus, si bien qu'un second déploiement ne renvoie que ce qui a changé.
 *
 * Variables :
 *   VERCEL_TOKEN         obligatoire — vercel.com/account/settings/tokens
 *   VERCEL_TEAM_ID       si le compte appartient à une équipe
 *   VERCEL_PROJECT_NAME  défaut : manovoyage
 *
 * Le jeton vaut pour tout le compte. À révoquer une fois le site en ligne.
 */

import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const API = 'https://api.vercel.com'
const JETON = process.env.VERCEL_TOKEN
const EQUIPE = process.env.VERCEL_TEAM_ID || ''
const NOM = process.env.VERCEL_PROJECT_NAME || 'manovoyage'
const ESSAI = process.argv.includes('--essai')
const PARALLELE = 4

/* Ce qui ne part pas en ligne : la documentation et les outils. */
const EXCLUS = new Set(['LISEZMOI.md', 'outils', '.git', '.github', 'node_modules'])

function equipe(url) {
  if (!EQUIPE) return url
  return url + (url.includes('?') ? '&' : '?') + 'teamId=' + EQUIPE
}

async function appeler(chemin, options = {}) {
  const r = await fetch(equipe(API + chemin), {
    ...options,
    headers: {
      Authorization: 'Bearer ' + JETON,
      ...(options.headers || {}),
    },
  })
  const texte = await r.text()
  let corps
  try { corps = texte ? JSON.parse(texte) : {} } catch { corps = { brut: texte } }
  if (!r.ok) {
    const m = corps?.error?.message || texte.slice(0, 300)
    throw new Error(`${options.method || 'GET'} ${chemin} → ${r.status} : ${m}`)
  }
  return corps
}

async function lister(dossier = RACINE) {
  const out = []
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    if (EXCLUS.has(entree.name) || entree.name.startsWith('.')) continue
    const p = join(dossier, entree.name)
    if (entree.isDirectory()) out.push(...(await lister(p)))
    else out.push(p)
  }
  return out
}

function ko(n) { return (n / 1024).toFixed(0) + ' Ko' }
function mo(n) { return (n / 1024 / 1024).toFixed(2) + ' Mo' }

async function main() {
  const chemins = await lister()
  const fichiers = []
  for (const p of chemins) {
    const contenu = await readFile(p)
    fichiers.push({
      chemin: p,
      nom: relative(RACINE, p).split(sep).join('/'),
      sha: createHash('sha1').update(contenu).digest('hex'),
      taille: contenu.length,
      contenu,
    })
  }
  const total = fichiers.reduce((s, f) => s + f.taille, 0)
  console.log(`${fichiers.length} fichiers, ${mo(total)}`)
  if (!fichiers.some((f) => f.nom === 'index.html')) {
    throw new Error('index.html introuvable — mauvais dossier ?')
  }

  if (ESSAI) {
    console.log('\n--essai : rien n’est envoyé. Les dix plus gros :')
    for (const f of [...fichiers].sort((a, b) => b.taille - a.taille).slice(0, 10)) {
      console.log('  ' + ko(f.taille).padStart(9) + '  ' + f.nom)
    }
    return
  }
  if (!JETON) throw new Error('VERCEL_TOKEN manquant — vercel.com/account/settings/tokens')

  console.log('\nTéléversement…')
  let faits = 0
  const file = [...fichiers]
  await Promise.all(
    Array.from({ length: PARALLELE }, async () => {
      while (file.length) {
        const f = file.pop()
        /* Vercel garde les fichiers qu'il connaît déjà : un renvoi coûte peu,
           et évite d'avoir à tenir un cache de notre côté. */
        await appeler('/v2/files', {
          method: 'POST',
          headers: {
            'Content-Length': String(f.taille),
            'x-vercel-digest': f.sha,
          },
          body: f.contenu,
        })
        faits++
        if (faits % 20 === 0 || faits === fichiers.length) {
          console.log(`  ${faits}/${fichiers.length}`)
        }
      }
    })
  )

  console.log('\nCréation du déploiement…')
  const dep = await appeler('/v13/deployments?forceNew=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: NOM,
      target: 'production',
      files: fichiers.map((f) => ({ file: f.nom, sha: f.sha, size: f.taille })),
      projectSettings: { framework: null },
    }),
  })
  console.log('  ' + dep.id)

  const debut = Date.now()
  for (;;) {
    const etat = await appeler(`/v13/deployments/${dep.id}`)
    if (etat.readyState === 'READY') {
      console.log(`\nEn ligne : https://${etat.alias?.[0] || etat.url}`)
      console.log(`Déploiement : https://${etat.url}`)
      console.log('\nRévoquez le jeton : vercel.com/account/settings/tokens')
      return
    }
    if (etat.readyState === 'ERROR' || etat.readyState === 'CANCELED') {
      throw new Error('déploiement ' + etat.readyState + ' — ' + (etat.errorMessage || ''))
    }
    if (Date.now() - debut > 300000) throw new Error('toujours pas prêt après cinq minutes')
    await new Promise((r) => setTimeout(r, 3000))
  }
}

main().catch((e) => {
  console.error('\n' + e.message)
  process.exit(1)
})
