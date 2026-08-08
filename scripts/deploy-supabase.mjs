#!/usr/bin/env node
/**
 * Déploiement du schéma sur un projet Supabase, via l'API de gestion.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_… SUPABASE_URL=https://<ref>.supabase.co \
 *     node scripts/deploy-supabase.mjs [--dry-run] [--baseline <version>]
 *
 * Applique les migrations de supabase/migrations/ qui ne le sont pas
 * encore, dans l'ordre des horodatages, et note chacune dans
 * `schema_migrations`. Les migrations ne sont pas idempotentes
 * (`create table` sans `if not exists`, volontairement : une migration
 * qui se rejoue en silence masque les divergences), donc le suivi est
 * ce qui rend le script rejouable.
 *
 * --baseline <version> : déclare appliquées toutes les migrations
 *   jusqu'à celle-ci incluse, sans rien exécuter. Sert une seule fois,
 *   sur une base déployée avant l'existence du suivi.
 *
 * --dry-run : affiche ce qui serait fait, sans rien écrire.
 *
 * Le jeton d'accès personnel vaut pour TOUS les projets du compte.
 * À révoquer dès la fin : supabase.com/dashboard/account/tokens
 */

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const API = 'https://api.supabase.com'
const JETON = process.env.SUPABASE_ACCESS_TOKEN
const URL_PROJET = process.env.SUPABASE_URL
const SEC = process.argv.includes('--dry-run')
const BASELINE = process.argv[process.argv.indexOf('--baseline') + 1]
const EN_BASELINE = process.argv.includes('--baseline')

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
if (EN_BASELINE && (!BASELINE || BASELINE.startsWith('--'))) {
  console.error('--baseline attend une version, par exemple : --baseline 20260806090200')
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

/** Le nom de fichier moins l'extension fait la version. */
const versionDe = (fichier) => fichier.replace(/_.*$/, '')

let code = 0

try {
  console.log(`Projet : ${ref}`)
  const projet = await gestion(`/v1/projects/${ref}`)
  console.log(`   ${projet.name} · ${projet.region} · ${projet.status}`)
  if (SEC) console.log('\n(mode --dry-run : rien ne sera écrit)')

  const migrations = (await readdir(join(racine, 'supabase/migrations')))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  // ---- Registre des migrations --------------------------------------
  if (!SEC) {
    await sql(`create table if not exists schema_migrations (
                 version     text primary key,
                 applique_le timestamptz not null default now()
               );`)
  }

  if (EN_BASELINE) {
    const jusqua = migrations.filter((f) => versionDe(f) <= BASELINE)
    if (!jusqua.length) {
      throw new Error(`Aucune migration jusqu’à ${BASELINE}.`)
    }
    console.log(`\nBaseline jusqu’à ${BASELINE} — déclarées appliquées sans exécution :`)
    for (const f of jusqua) {
      if (!SEC) {
        await sql(
          `insert into schema_migrations (version) values ('${versionDe(f)}')
           on conflict (version) do nothing;`
        )
      }
      console.log(`   ${SEC ? '·' : '✔'} ${f}`)
    }
    console.log('\nRelancez sans --baseline pour appliquer la suite.')
    process.exitCode = 0
  } else {
    // Le registre est LU même à blanc : un --dry-run qui annonce des
    // migrations déjà passées n'a aucune valeur, et c'est justement ce
    // sur quoi on s'appuie avant de toucher une base réelle. Lire ne
    // modifie rien ; seule la création de la table est sautée, d'où le
    // repli sur un registre vide si elle n'existe pas encore.
    let dejaFaites = new Set()
    try {
      const lignes = await sql('select version from schema_migrations')
      dejaFaites = new Set(lignes.map((l) => l.version))
    } catch (e) {
      if (!SEC) throw e
      console.log('\n(registre des migrations absent : tout apparaîtra en attente)')
    }

    const aFaire = migrations.filter((f) => !dejaFaites.has(versionDe(f)))

    if (!aFaire.length) {
      console.log('\nAucune migration en attente. La base est à jour.')
    } else {
      // pg_cron est ici et pas dans une migration : le harnais local
      // tourne sur un PostgreSQL nu, où l'extension n'existe pas. La
      // migration reste ainsi jouable dans les deux mondes.
      console.log('\nExtension :')
      if (SEC) console.log('   · create extension if not exists pg_cron')
      else {
        await sql('create extension if not exists pg_cron;')
        console.log('   ✔ pg_cron')
      }

      console.log('\nMigrations en attente :')
      for (const fichier of aFaire) {
        const contenu = await readFile(join(racine, 'supabase/migrations', fichier), 'utf8')
        if (SEC) {
          console.log(`   · ${fichier} (${contenu.split('\n').length} lignes)`)
          continue
        }
        await sql(contenu)
        await sql(
          `insert into schema_migrations (version) values ('${versionDe(fichier)}')
           on conflict (version) do nothing;`
        )
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

    // ---- Hook ---------------------------------------------------------
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
      console.log('\nÀ jour. Vérifiez avec le test d’isolation réel :')
      console.log('   npm run test:isolation:live')
      console.log('\nPuis révoquez le jeton : supabase.com/dashboard/account/tokens')
    }
  }
} catch (e) {
  code = 1
  console.error('\n' + (e?.message ?? e))
}

process.exitCode = code
