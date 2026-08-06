#!/usr/bin/env node
/**
 * Test d'isolation sur un PostgreSQL local jetable.
 *
 *   npm run test:isolation
 *
 * Démarre un PostgreSQL embarqué (ni Docker ni installation système),
 * applique l'échafaudage Supabase minimal puis les migrations dans
 * l'ordre, joue supabase/tests/isolation.sql, et éteint tout.
 *
 * Puis il fait l'inverse : il RECOMMENCE en cassant volontairement une
 * protection à la fois, et vérifie que le test s'en aperçoit. Un test
 * d'étanchéité qu'on n'a jamais vu virer au rouge ne prouve rien —
 * c'est la seule façon de savoir qu'il tiendra le jour où quelqu'un
 * modifiera une politique sans y penser.
 *
 * PORTÉE — à lire avant de se rassurer avec un résultat vert.
 * Ce harnais valide les POLITIQUES RLS, les GRANT, l'absence de
 * politique UPDATE/DELETE et la fonction du hook. Il ne valide pas le
 * déploiement Supabase : l'émission réelle des jetons par GoTrue et le
 * branchement du Custom Access Token Hook dans le tableau de bord
 * restent à vérifier sur le projet réel, avec le même fichier :
 *
 *   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
 */

import { readFile, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const donnees = join(racine, '.pg-test')
const PORT = 54329

/**
 * PostgreSQL embarqué pèse ~110 Mo de binaires. Il est délibérément
 * ABSENT des dépendances : Vercel installe les devDependencies pour
 * construire le front, et téléchargerait donc un PostgreSQL Linux
 * complet à chaque déploiement, pour un harnais qui n'y tourne jamais.
 * On le charge à la demande, en le disant clairement s'il manque.
 */
let EmbeddedPostgres, pg
try {
  ;[{ default: EmbeddedPostgres }, { default: pg }] = await Promise.all([
    import('embedded-postgres'),
    import('pg'),
  ])
} catch {
  console.error(
    'Le harnais local a besoin de PostgreSQL embarqué (~110 Mo), tenu hors des\n' +
      'dépendances pour ne pas alourdir les builds Vercel. Une fois :\n\n' +
      '    npm run test:isolation:install\n'
  )
  process.exit(1)
}

const lire = (chemin) => readFile(join(racine, chemin), 'utf8')

/**
 * Chaque sabotage doit faire échouer le test, et sur la BONNE
 * assertion. Un sabotage qui déclenche un autre échec que celui attendu
 * signalerait que le test mesure autre chose que ce qu'on croit.
 */
const SABOTAGES = [
  {
    nom: 'une politique de lecture trop permissive sur evenement',
    attendu: 'ÉCHEC 1',
    sql: `create policy evenement_fuite on evenement
            for select to authenticated using (true);`,
  },
  {
    nom: 'la vue vehicule_present repasse en security_definer',
    attendu: 'ÉCHEC 5',
    sql: `alter view vehicule_present set (security_invoker = false);`,
  },
  {
    nom: 'le with check n’impose plus l’auteur',
    attendu: 'ÉCHEC 7',
    sql: `drop policy evenement_ecriture on evenement;
          create policy evenement_ecriture on evenement
            for insert to authenticated
            with check (etablissement_id = etab_courant());`,
  },
  {
    nom: 'le journal redevient modifiable',
    attendu: 'ÉCHEC 8',
    sql: `create policy evenement_maj on evenement
            for update to authenticated
            using (etablissement_id = etab_courant())
            with check (etablissement_id = etab_courant());`,
  },
  {
    nom: 'la purge redevient appelable par un compte connecté',
    attendu: 'ÉCHEC 10',
    sql: `grant execute on function purger_evenements() to authenticated;`,
  },
  {
    nom: 'le hook JWT revient au jsonb_set naïf (sans coalesce)',
    attendu: 'ÉCHEC 12',
    sql: `create or replace function auth_hook_claims(event jsonb)
          returns jsonb language plpgsql stable security definer
          set search_path = public as $f$
          declare m record; claims jsonb;
          begin
            select etablissement_id, role into m
              from membre where user_id = (event->>'user_id')::uuid;
            claims := coalesce(event->'claims', '{}'::jsonb);
            if m.etablissement_id is not null then
              claims := jsonb_set(claims, '{app_metadata,etablissement_id}',
                                  to_jsonb(m.etablissement_id::text), true);
              claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(m.role), true);
            end if;
            return jsonb_set(event, '{claims}', claims);
          end; $f$;`,
  },
]

let pgsql
let code = 0

function connexion(base) {
  const client = new pg.Client({
    host: 'localhost',
    port: PORT,
    user: 'postgres',
    password: 'postgres',
    database: base,
  })
  // Les notices du serveur sont le compte rendu du test. On ne garde
  // que celles du script — le reste est du bruit d'installation.
  client.on('notice', (n) => {
    const t = (n.message ?? '').trimEnd()
    if (t.includes('ISOLATION')) console.log('   ' + t)
  })
  // Sans ce gestionnaire, une coupure de socket devient un 'error' non
  // capté et fait tomber le processus au lieu de rapporter un échec.
  client.on('error', () => {})
  return client
}

/** Applique l'échafaudage + les migrations sur une base neuve. */
async function preparer(base, migrations, sabotage) {
  await pgsql.createDatabase(base)
  const client = connexion(base)
  await client.connect()
  // Les sabotages provoquent des erreurs VOULUES. Sans ça, le serveur
  // journalise chaque instruction fautive en entier et noie le compte
  // rendu sous le SQL qu'on vient délibérément de faire échouer. Réglé
  // par session : au démarrage du serveur, ça étoufferait aussi la
  // ligne « ready » que le lanceur attend pour savoir qu'il peut se
  // connecter.
  await client.query("set log_min_error_statement = 'panic'")
  await client.query(await lire('supabase/tests/prelude-local.sql'))
  for (const f of migrations) {
    await client.query(await lire(join('supabase/migrations', f)))
  }
  if (sabotage) await client.query(sabotage)
  return client
}

try {
  await rm(donnees, { recursive: true, force: true })

  pgsql = new EmbeddedPostgres({
    databaseDir: donnees,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: false,
  })

  console.log('PostgreSQL local : initialisation…')
  await pgsql.initialise()
  await pgsql.start()

  const migrations = (await readdir(join(racine, 'supabase/migrations')))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  // ---- 1. Schéma intact : le test doit passer -----------------------
  const client = await preparer('parking_test', migrations)

  const version = (await client.query('select version()')).rows[0].version
  console.log('   ' + version.split(',')[0])
  console.log('\nMigrations :')
  migrations.forEach((f) => console.log('   ✔ ' + f))

  const { rows: taches } = await client.query('select jobname, schedule from cron.job')
  if (taches.length !== 1 || taches[0].jobname !== 'purge-parking') {
    throw new Error('La purge RGPD n’est pas planifiée par les migrations.')
  }
  console.log(`   ✔ purge planifiée (${taches[0].schedule})`)

  console.log('\nTest d’isolation :')
  await client.query(await lire('supabase/tests/isolation.sql'))

  const { rows } = await client.query('select count(*)::int as n from evenement')
  if (rows[0].n !== 0) {
    throw new Error(`Le test a laissé ${rows[0].n} ligne(s) derrière lui.`)
  }
  console.log('   ✔ rollback : aucune trace laissée dans la base')
  await client.end()

  // ---- 2. Schéma saboté : le test doit échouer ----------------------
  console.log('\nLe test détecte-t-il une protection retirée ?')
  const scenario = await lire('supabase/tests/isolation.sql')
  let manques = 0

  for (const [i, s] of SABOTAGES.entries()) {
    const c = await preparer(`sabotage_${i}`, migrations, s.sql)
    let verdict
    try {
      await c.query(scenario)
      verdict = { ok: false, detail: 'le test est passé au vert malgré tout' }
    } catch (e) {
      const message = e?.message ?? ''
      verdict = message.includes(s.attendu)
        ? { ok: true }
        : { ok: false, detail: `attendu ${s.attendu}, obtenu : ${message.split('\n')[0]}` }
    }
    await c.query('rollback').catch(() => {})
    await c.end()

    if (verdict.ok) {
      console.log(`   ✔ ${s.attendu} — ${s.nom}`)
    } else {
      manques++
      console.log(`   ✖ ${s.nom}\n       ${verdict.detail}`)
    }
  }

  if (manques) {
    throw new Error(
      `${manques} protection(s) peuvent être retirées sans que le test s’en aperçoive.`
    )
  }

  console.log(`\n${SABOTAGES.length}/${SABOTAGES.length} sabotages détectés.`)
  console.log('\nRappel : ce harnais valide les politiques, pas le déploiement.')
  console.log('Rejouez le même fichier sur le projet Supabase réel avant mise en service.')
} catch (e) {
  code = 1
  console.error('\n' + (e?.message ?? e))
  if (e?.where) console.error(e.where)
} finally {
  if (pgsql) {
    try {
      await pgsql.stop()
    } catch {
      /* le serveur n'avait pas démarré */
    }
  }
  await rm(donnees, { recursive: true, force: true }).catch(() => {})
}

process.exit(code)
