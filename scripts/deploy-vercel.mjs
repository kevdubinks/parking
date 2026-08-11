#!/usr/bin/env node
/**
 * Import du dépôt dans Vercel, et premier déploiement.
 *
 *   VERCEL_TOKEN=… SUPABASE_URL=… SUPABASE_PUBLISHABLE_KEY=… \
 *     node scripts/deploy-vercel.mjs [--dry-run]
 *
 * Crée le projet branché sur le dépôt GitHub, y pose les deux variables
 * d'environnement, déclenche un déploiement de `main` et attend qu'il
 * soit prêt.
 *
 * Rejouable : si le projet existe déjà, il est réutilisé, et les
 * variables sont mises à jour plutôt que dupliquées.
 *
 * Ce qui N'EST PAS posé ici : la clé secrète Supabase. Elle contourne
 * le RLS ; elle n'a rien à faire dans un environnement de build dont le
 * contenu finit dans le navigateur (CLAUDE.md § 6).
 *
 * Le jeton Vercel vaut pour tout le compte. À révoquer dès la fin :
 * vercel.com/account/settings/tokens
 */

const API = 'https://api.vercel.com'
const JETON = process.env.VERCEL_TOKEN
const EQUIPE = process.env.VERCEL_TEAM_ID || ''
const NOM = process.env.VERCEL_PROJECT_NAME || 'parking-hotel'
const DEPOT = process.env.GITHUB_REPO || 'kevdubinks/parking'
const SUPA_URL = process.env.SUPABASE_URL
const SUPA_CLE = process.env.SUPABASE_PUBLISHABLE_KEY
const SEC = process.argv.includes('--dry-run')

if (!JETON || !SUPA_URL || !SUPA_CLE) {
  console.error(
    'Variables manquantes : VERCEL_TOKEN, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY'
  )
  process.exit(1)
}
if (SUPA_CLE.startsWith('sb_secret_') || SUPA_CLE.startsWith('service_role')) {
  console.error(
    'SUPABASE_PUBLISHABLE_KEY a reçu une clé SECRÈTE.\n' +
      'Elle serait exposée au navigateur et contournerait le RLS. Refus.'
  )
  process.exit(1)
}

const [org, repo] = DEPOT.split('/')
const q = EQUIPE ? `?teamId=${EQUIPE}` : ''
const qs = (extra) => (EQUIPE ? `?teamId=${EQUIPE}&${extra}` : `?${extra}`)

async function vercel(chemin, init = {}) {
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
    const e = new Error(
      `${init.method ?? 'GET'} ${chemin.split('?')[0]} → ${r.status} ` +
        (corps?.error?.message ?? JSON.stringify(corps)).slice(0, 300)
    )
    e.statut = r.status
    e.code = corps?.error?.code
    throw e
  }
  return corps
}

const VARIABLES = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', value: SUPA_URL },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: SUPA_CLE },
]

let code = 0

try {
  const moi = await vercel(`/v2/user${q}`)
  console.log(`Compte Vercel : ${moi.user?.username ?? moi.user?.email}`)
  console.log(`Dépôt         : ${DEPOT}`)
  console.log(`Projet        : ${NOM}`)
  if (SEC) console.log('\n(mode --dry-run : rien ne sera écrit)')

  // ---- 1. Projet ----------------------------------------------------
  let projet = null
  try {
    projet = await vercel(`/v9/projects/${NOM}${q}`)
    console.log('\nProjet existant, réutilisé.')
  } catch (e) {
    if (e.statut !== 404) throw e
  }

  if (!projet) {
    if (SEC) {
      console.log('\nProjet :')
      console.log(`   · créer ${NOM}, framework nextjs, branché sur ${DEPOT} (main)`)
    } else {
      console.log('\nProjet :')
      try {
        projet = await vercel(`/v11/projects${q}`, {
          method: 'POST',
          body: JSON.stringify({
            name: NOM,
            framework: 'nextjs',
            gitRepository: { type: 'github', repo: DEPOT },
          }),
        })
        console.log(`   ✔ créé et branché sur ${DEPOT}`)
      } catch (e) {
        // Un 403 sur la création alors que la lecture passe, c'est un
        // jeton en lecture seule ou de portée trop étroite. Le dire,
        // plutôt que de laisser un « 403 » nu qu'on prend pour un
        // problème d'équipe et qu'on cherche une heure.
        if (e.statut === 403) {
          const lecture = await vercel(`/v9/projects${qs('limit=1')}`).then(
            () => true,
            () => false
          )
          console.error(
            `   ✖ ${e.message}\n\n` +
              (lecture
                ? `     Ce jeton LIT les projets mais ne peut pas en créer : il est en\n` +
                  `     lecture seule, ou sa portée est trop étroite.\n\n` +
                  `     Créez-en un autre avec les droits d'écriture sur l'équipe :\n` +
                  `        vercel.com/account/settings/tokens\n` +
                  `     Scope : l'équipe qui porte les projets, pas « read-only ».\n`
                : `     Ce jeton n'a accès à rien. Vérifiez qu'il n'est pas expiré.\n`)
          )
          throw new Error('Jeton sans droit de création.')
        }
        // Autre cause fréquente : l'application GitHub de Vercel n'a pas
        // accès au dépôt. Ça ne se règle pas non plus par l'API.
        if (/git|repo|installation/i.test(e.message)) {
          console.error(
            `   ✖ ${e.message}\n\n` +
              `     Vercel n'a pas accès à ${DEPOT}. Installez l'application GitHub\n` +
              `     de Vercel sur ce dépôt, puis relancez :\n` +
              `        github.com/apps/vercel  →  Configure  →  ${org}\n`
          )
          throw new Error('Accès GitHub manquant.')
        }
        throw e
      }
    }
  }

  // ---- 2. Variables d'environnement ---------------------------------
  console.log('\nVariables d’environnement :')
  if (SEC) {
    for (const v of VARIABLES) console.log(`   · ${v.key} (production, preview, development)`)
  } else {
    const existantes = (await vercel(`/v10/projects/${projet.id}/env${qs('decrypt=false')}`)).envs ?? []
    for (const v of VARIABLES) {
      /**
       * Une même clé peut exister en PLUSIEURS exemplaires, un par
       * environnement — c'est ce que produit l'ajout manuel depuis le
       * tableau de bord. Un `find` n'en voyait qu'un, et lui imposer
       * les trois cibles faisait entrer Vercel en conflit avec les
       * autres. On met donc à jour chaque exemplaire sans toucher à sa
       * portée.
       */
      const anciennes = existantes.filter((e) => e.key === v.key)
      if (anciennes.length) {
        for (const ancienne of anciennes) {
          await vercel(`/v9/projects/${projet.id}/env/${ancienne.id}${q}`, {
            method: 'PATCH',
            body: JSON.stringify({ value: v.value }),
          })
        }
        const portees = anciennes.flatMap((e) => e.target ?? []).join(', ')
        console.log(`   ✔ ${v.key} (mise à jour — ${portees || 'portée inchangée'})`)
      } else {
        await vercel(`/v10/projects/${projet.id}/env${q}`, {
          method: 'POST',
          body: JSON.stringify({
            key: v.key,
            value: v.value,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        })
        console.log(`   ✔ ${v.key}`)
      }
    }
  }

  // ---- 3. Déploiement -----------------------------------------------
  console.log('\nDéploiement de main :')
  if (SEC) {
    console.log('   · déclencher, puis attendre l’état READY')
  } else {
    const dep = await vercel(`/v13/deployments${qs('forceNew=1')}`, {
      method: 'POST',
      body: JSON.stringify({
        name: NOM,
        project: projet.id,
        target: 'production',
        gitSource: { type: 'github', org, repo, ref: 'main' },
      }),
    })
    console.log(`   · lancé : ${dep.url}`)

    let etat = dep.readyState ?? dep.status
    const debut = Date.now()
    while (!['READY', 'ERROR', 'CANCELED'].includes(etat)) {
      if (Date.now() - debut > 8 * 60_000) {
        etat = 'TIMEOUT'
        break
      }
      await new Promise((r) => setTimeout(r, 5000))
      const suivi = await vercel(`/v13/deployments/${dep.id}${q}`)
      const nouveau = suivi.readyState ?? suivi.status
      if (nouveau !== etat) console.log(`   · ${nouveau.toLowerCase()}`)
      etat = nouveau
    }

    if (etat === 'READY') {
      console.log(`   ✔ en ligne : https://${dep.url}`)
      const prod = projet.alias?.[0]?.domain
      if (prod) console.log(`   ✔ alias    : https://${prod}`)
    } else {
      code = 1
      console.log(`   ✖ état final : ${etat}`)
      console.log(`     Journal : https://vercel.com/${moi.user?.username}/${NOM}`)
    }
  }

  if (!SEC && code === 0) {
    console.log('\nRévoquez le jeton : vercel.com/account/settings/tokens')
  }
} catch (e) {
  code = 1
  console.error('\n' + (e?.message ?? e))
}

process.exitCode = code
