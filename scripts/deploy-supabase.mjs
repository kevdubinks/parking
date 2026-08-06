#!/usr/bin/env node
/**
 * Déploiement du schéma sur un projet Supabase, via l'API de gestion.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_… SUPABASE_URL=https://<ref>.supabase.co \
 *     node scripts/deploy-supabase.mjs
 *
 * Fait, dans l'ordre :
 *   1. vérifie l'accès au projet et refuse d'agir si le schéma est déjà là
 *      (les migrations ne sont pas idempotentes : `create table` sans
 *      `if not exists`, volontairement — une migration qui se rejoue en
 *      silence masque les divergences) ;
 *   2. active pg_cron, sans quoi la migration de purge échoue sur
 *      cron.schedule ;
 *   3. applique supabase/migrations/ dans l'ordre des horodatages ;
 *   4. branche le Custom Access Token Hook sur public.auth_hook_claims ;
 *   5. relit la configuration pour confirmer que le hook est actif.
 *
 * Le jeton d'accès personnel vaut pour TOUS les projets du compte.
 * À révoquer dès la fin : supabase.com/dashboard/account/tokens
 *
 * --dry-run affiche ce qui serait fait, sans rien écrire.
 */

const API = 'https://api.supabase.com'
const JETON = process.env.SUPABASE_ACCESS_TOKEN
const URL_PROJET = process.env.SUPABASE_URL
const SEC = process.argv.includes('--dry-run')

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')

if (!JETON || !URL_PROJET) {
  console.error('Variables manquantes : SUPABASE_ACCESS_TOKEN, SUPABASE_URL')
  process.exit(1)
}
if (!JETON.startsWith('sbp_')) {
  console.error(
    'SUPABASE_ACCESS_TOKEN doit être un jeton d’accès personnel (sbp_…).\n' +
      'Les clés sb_secret_… / sb_publishable_… ne donnent pas accès à l’API de gestion.'
  )
  process.exit(1)
}

const ref = new URL(URL_PROJET).hostname.split('.')[0]

async function gestion(chemin, init = {}) {
  const r = await fetch(`${API}${chemin}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${JETON}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const texte = await r.text()
  let corps = null
  try {
    corps = texte ? JSON.parse(texte) : null
  } catch {
    corps = texte
  }
  if (!r.ok) {
    throw new Error(`${init.method ?? 'GET'} ${chemin} → ${r.status} ${JSON.stringify(corps)}`)
  }
  return corps
}

const sql = (query) =>
  gestion(`/v1/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })

let code = 0

try {
  console.log(`Projet : ${ref}`)
  const projet = await gestion(`/v1/projects/${ref}`)
  console.log(`   ${projet.name} · ${projet.region} · ${projet.status}`)
  if (SEC) console.log('\n(mode --dry-run : rien ne sera écrit)')

  // ---- 1. Le schéma est-il déjà là ? --------------------------------
  const deja = await sql(
    "select to_regclass('public.etablissement') is not null as presente"
  )
  if (deja?.[0]?.presente) {
    console.log('\nLe schéma est déjà déployé. Rien à faire.')
    console.log('Pour repartir de zéro, supprimez les tables à la main — ce script')
    console.log('ne détruit jamais de données.')
    process.exitCode = 0
  } else {
    const migrations = (await readdir(join(racine, 'supabase/migrations')))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    // ---- 2. pg_cron -------------------------------------------------
    // Volontairement ici et pas dans une migration : le harnais local
    // tourne sur un PostgreSQL nu, où l'extension n'existe pas. La
    // migration reste donc jouable dans les deux mondes.
    console.log('\nExtension :')
    if (SEC) console.log('   · create extension if not exists pg_cron')
    else {
      await sql('create extension if not exists pg_cron;')
      console.log('   ✔ pg_cron')
    }

    // ---- 3. Migrations ----------------------------------------------
    console.log('\nMigrations :')
    for (const fichier of migrations) {
      const contenu = await readFile(join(racine, 'supabase/migrations', fichier), 'utf8')
      if (SEC) {
        console.log(`   · ${fichier} (${contenu.split('\n').length} lignes)`)
        continue
      }
      await sql(contenu)
      console.log(`   ✔ ${fichier}`)
    }

    if (!SEC) {
      const taches = await sql(
        "select jobname, schedule from cron.job where jobname = 'purge-parking'"
      )
      if (taches?.length === 1) console.log(`   ✔ purge planifiée (${taches[0].schedule})`)
      else console.log('   ✖ la purge RGPD n’est pas planifiée')
    }
  }

  // ---- 4. Hook ------------------------------------------------------
  console.log('\nCustom Access Token Hook :')
  const uri = 'pg-functions://postgres/public/auth_hook_claims'
  if (SEC) {
    console.log(`   · hook_custom_access_token_enabled = true`)
    console.log(`   · hook_custom_access_token_uri = ${uri}`)
  } else {
    await gestion(`/v1/projects/${ref}/config/auth`, {
      method: 'PATCH',
      body: JSON.stringify({
        hook_custom_access_token_enabled: true,
        hook_custom_access_token_uri: uri,
      }),
    })
    const conf = await gestion(`/v1/projects/${ref}/config/auth`)
    if (conf.hook_custom_access_token_enabled && conf.hook_custom_access_token_uri === uri) {
      console.log(`   ✔ branché sur ${uri}`)
    } else {
      code = 1
      console.log(
        `   ✖ non branché (enabled=${conf.hook_custom_access_token_enabled}, uri=${conf.hook_custom_access_token_uri})`
      )
    }
  }

  if (!SEC && code === 0) {
    console.log('\nDéployé. Enchaînez avec le test d’isolation réel :')
    console.log('   npm run test:isolation:live')
    console.log('\nPuis révoquez le jeton : supabase.com/dashboard/account/tokens')
  }
} catch (e) {
  code = 1
  console.error('\n' + (e?.message ?? e))
}

process.exitCode = code
