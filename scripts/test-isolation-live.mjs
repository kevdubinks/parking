#!/usr/bin/env node
/**
 * Test d'isolation sur le projet Supabase RÉEL.
 *
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/test-isolation-live.mjs
 *
 * Complément indispensable de `npm run test:isolation`, qui valide les
 * politiques sur un PostgreSQL nu. Celui-ci valide le DÉPLOIEMENT :
 * GoTrue émet-il des jetons, le Custom Access Token Hook est-il
 * réellement activé dans le tableau de bord, le claim arrive-t-il
 * jusqu'à PostgREST, et le RLS tient-il de bout en bout.
 *
 * Il crée deux comptes et deux établissements jetables, se connecte
 * pour de vrai, attaque l'API avec le jeton de chacun, puis SUPPRIME
 * tout ce qu'il a créé — et uniquement ça, par identifiant.
 *
 * La clé secrète ne sert qu'à préparer et à nettoyer. Toutes les
 * assertions passent par la clé publiable et un vrai jeton
 * utilisateur : c'est le chemin que suit l'application.
 */

const URL_BASE = process.env.SUPABASE_URL
const SECRET = process.env.SUPABASE_SECRET_KEY
const PUBLIABLE = process.env.SUPABASE_PUBLISHABLE_KEY

if (!URL_BASE || !SECRET || !PUBLIABLE) {
  console.error(
    'Variables manquantes : SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY'
  )
  process.exit(1)
}

const marque = Math.random().toString(36).slice(2, 8)
const nes = { users: [], etablissements: [] }
let echecs = 0

const ok = (m) => console.log(`   ✔ ${m}`)
const ko = (m) => {
  echecs++
  console.log(`   ✖ ${m}`)
}

/** Appel PostgREST avec les droits de service : préparation et ménage. */
async function service(chemin, init = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  })
  const texte = await r.text()
  return { statut: r.status, corps: texte ? JSON.parse(texte) : null }
}

/** Appel PostgREST comme le fait l'application : clé publiable + jeton. */
async function commeUtilisateur(jeton, chemin, init = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: PUBLIABLE,
      Authorization: `Bearer ${jeton}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
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
  return { statut: r.status, corps }
}

async function creerCompte(suffixe) {
  const email = `isolation-${marque}-${suffixe}@example.com`
  const motDePasse = `Test-${marque}-${suffixe}-Aa1!`
  const r = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: motDePasse, email_confirm: true }),
  })
  const corps = await r.json()
  if (!r.ok) throw new Error(`Création du compte ${suffixe} refusée : ${JSON.stringify(corps)}`)
  nes.users.push(corps.id)
  return { id: corps.id, email, motDePasse }
}

async function seConnecter({ email, motDePasse }) {
  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: PUBLIABLE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: motDePasse }),
  })
  const corps = await r.json()
  if (!r.ok) throw new Error(`Connexion refusée : ${JSON.stringify(corps)}`)
  return corps.access_token
}

function claimsDe(jeton) {
  const charge = jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(Buffer.from(charge, 'base64').toString('utf8'))
}

const evenement = (etab, auteur, plaque) => ({
  id: crypto.randomUUID(),
  etablissement_id: etab,
  type: 'ENTREE',
  plaque,
  plaque_saisie: plaque,
  chambre: '12',
  survenu_le: new Date().toISOString(),
  auteur,
})

try {
  console.log(`Projet : ${URL_BASE}`)
  console.log(`Marque des données jetables : isolation-${marque}\n`)

  // ---- Le schéma est-il seulement là ? ------------------------------
  const sonde = await service('etablissement?select=id&limit=1')
  if (sonde.statut === 404) {
    // On lève au lieu de sortir : `process.exit` ici tuerait le
    // processus avec une requête encore ouverte, et surtout sauterait
    // le nettoyage.
    throw new Error(
      'Le schéma n’est pas déployé : la table `etablissement` est introuvable.\n' +
        'Appliquez supabase/migrations/ avant de lancer ce test.'
    )
  }

  // ---- Préparation --------------------------------------------------
  console.log('Préparation (clé de service) :')
  const etabs = await service('etablissement', {
    method: 'POST',
    body: JSON.stringify([
      { nom: `ZZ test isolation ${marque} A`, places: 10 },
      { nom: `ZZ test isolation ${marque} B`, places: 10 },
    ]),
  })
  if (etabs.statut >= 300) throw new Error(`Création des établissements : ${JSON.stringify(etabs.corps)}`)
  const [etabA, etabB] = etabs.corps.map((e) => e.id)
  nes.etablissements.push(etabA, etabB)
  ok('deux établissements jetables')

  const compteA = await creerCompte('a')
  const compteB = await creerCompte('b')
  ok('deux comptes jetables')

  const membres = await service('membre', {
    method: 'POST',
    body: JSON.stringify([
      { user_id: compteA.id, etablissement_id: etabA, role: 'direction' },
      { user_id: compteB.id, etablissement_id: etabB, role: 'direction' },
    ]),
  })
  if (membres.statut >= 300) throw new Error(`Rattachement : ${JSON.stringify(membres.corps)}`)
  ok('rattachements membre')

  // Un événement chez B, posé avec la clé de service : c'est celui que
  // A ne doit jamais voir.
  const chezB = await service('evenement', {
    method: 'POST',
    body: JSON.stringify(evenement(etabB, compteB.id, 'BB222BB')),
  })
  if (chezB.statut >= 300) throw new Error(`Événement chez B : ${JSON.stringify(chezB.corps)}`)
  ok('un événement chez B, que A ne doit jamais voir')

  // ---- Le hook est-il branché ? -------------------------------------
  console.log('\nJeton réel émis par GoTrue :')
  const jetonA = await seConnecter(compteA)
  const jetonB = await seConnecter(compteB)
  const claimsA = claimsDe(jetonA)
  const etabDuJeton = claimsA?.app_metadata?.etablissement_id

  if (!etabDuJeton) {
    console.log('   ✖ ÉCHEC — le jeton ne porte aucun etablissement_id.')
    console.log(
      '\n     Le Custom Access Token Hook n’est pas activé.\n' +
        '     Authentication → Hooks → Custom Access Token → public.auth_hook_claims\n' +
        '     Sans lui le RLS ne laisse rien passer : l’application affichera un\n' +
        '     registre vide, ce qui est le comportement voulu mais pas exploitable.'
    )
    echecs++
  } else if (etabDuJeton !== etabA) {
    ko(`le jeton porte le mauvais établissement (${etabDuJeton} au lieu de ${etabA})`)
  } else {
    ok('le hook injecte etablissement_id dans le jeton')
    if (claimsA.app_metadata.role === 'direction') ok('le hook injecte aussi le rôle')
    else ko(`rôle attendu « direction », obtenu « ${claimsA.app_metadata.role} »`)
  }

  // ---- Étanchéité, à travers PostgREST ------------------------------
  console.log('\nÉtanchéité via l’API, avec le jeton de A :')

  const ecritA = await commeUtilisateur(jetonA, 'evenement', {
    method: 'POST',
    body: JSON.stringify(evenement(etabA, compteA.id, 'AA111AA')),
  })
  if (ecritA.statut === 201) ok('1 — A écrit chez lui')
  else ko(`1 — A ne peut pas écrire chez lui (${ecritA.statut} ${JSON.stringify(ecritA.corps)})`)

  const luA = await commeUtilisateur(jetonA, 'evenement?select=id,etablissement_id')
  const vus = Array.isArray(luA.corps) ? luA.corps : []
  if (vus.length === 1 && vus[0].etablissement_id === etabA) ok('2 — A ne voit que son établissement')
  else ko(`2 — A voit ${vus.length} événement(s) : FUITE possible`)

  const chezVoisin = await commeUtilisateur(jetonA, 'evenement', {
    method: 'POST',
    body: JSON.stringify(evenement(etabB, compteA.id, 'ZZ999ZZ')),
  })
  if (chezVoisin.statut === 403 || chezVoisin.corps?.code === '42501') ok('3 — A ne peut pas écrire chez B')
  else ko(`3 — A a écrit chez B (${chezVoisin.statut}) : FUITE`)

  const fauxAuteur = await commeUtilisateur(jetonA, 'evenement', {
    method: 'POST',
    body: JSON.stringify(evenement(etabA, compteB.id, 'YY888YY')),
  })
  if (fauxAuteur.statut === 403 || fauxAuteur.corps?.code === '42501') ok('4 — A ne peut pas falsifier l’auteur')
  else ko(`4 — A a écrit en se faisant passer pour B (${fauxAuteur.statut})`)

  const maj = await commeUtilisateur(jetonA, 'evenement?plaque=eq.AA111AA', {
    method: 'PATCH',
    body: JSON.stringify({ chambre: '999' }),
  })
  const majTouchees = Array.isArray(maj.corps) ? maj.corps.length : -1
  if (maj.statut === 403 || majTouchees === 0) ok('5 — le journal n’est pas modifiable')
  else ko(`5 — ${majTouchees} ligne(s) modifiée(s) dans un journal append-only`)

  const sup = await commeUtilisateur(jetonA, 'evenement?plaque=eq.AA111AA', { method: 'DELETE' })
  const supTouchees = Array.isArray(sup.corps) ? sup.corps.length : -1
  if (sup.statut === 403 || supTouchees === 0) ok('6 — le journal n’est pas effaçable')
  else ko(`6 — ${supTouchees} ligne(s) supprimée(s) dans un journal append-only`)

  const vue = await commeUtilisateur(jetonA, 'vehicule_present?select=plaque')
  const vusVue = Array.isArray(vue.corps) ? vue.corps : []
  if (vusVue.length === 1 && vusVue[0].plaque === 'AA111AA') ok('7 — la vue vehicule_present est étanche')
  else ko(`7 — la vue laisse voir ${vusVue.length} véhicule(s)`)

  const purge = await commeUtilisateur(jetonA, 'rpc/purger_evenements', { method: 'POST', body: '{}' })
  if (purge.statut === 404 || purge.statut === 403) ok('8 — la purge n’est pas appelable par un compte connecté')
  else ko(`8 — un compte connecté a pu appeler la purge (${purge.statut})`)

  const etabsVus = await commeUtilisateur(jetonA, 'etablissement?select=id')
  const nbEtabs = Array.isArray(etabsVus.corps) ? etabsVus.corps.length : -1
  if (nbEtabs === 1) ok('9 — A ne voit que son propre établissement')
  else ko(`9 — A voit ${nbEtabs} établissement(s)`)

  const membresVus = await commeUtilisateur(jetonA, 'membre?select=user_id')
  const nbMembres = Array.isArray(membresVus.corps) ? membresVus.corps.length : -1
  if (nbMembres === 1) ok('10 — A ne voit que sa propre ligne membre')
  else ko(`10 — A voit ${nbMembres} ligne(s) membre`)

  console.log('\nSymétrie, avec le jeton de B :')
  const luB = await commeUtilisateur(jetonB, 'evenement?select=id,etablissement_id')
  const vusB = Array.isArray(luB.corps) ? luB.corps : []
  if (vusB.length === 1 && vusB[0].etablissement_id === etabB) ok('11 — B ne voit que le sien')
  else ko(`11 — B voit ${vusB.length} événement(s)`)

  const sansJeton = await fetch(`${URL_BASE}/rest/v1/evenement?select=id`, {
    headers: { apikey: PUBLIABLE, Authorization: `Bearer ${PUBLIABLE}` },
  })
  const anon = await sansJeton.json()
  if (Array.isArray(anon) && anon.length === 0) ok('12 — un visiteur non connecté ne voit rien')
  else ko(`12 — un visiteur non connecté voit ${JSON.stringify(anon).slice(0, 80)}`)
} catch (e) {
  echecs++
  console.error('\n' + (e?.message ?? e))
} finally {
  // ---- Ménage : uniquement ce que ce script a créé -------------------
  if (!nes.etablissements.length && !nes.users.length) {
    console.log('\nRien n’a été créé : rien à nettoyer.')
  } else {
  console.log('\nNettoyage :')
  try {
    for (const id of nes.etablissements) {
      // evenement et membre partent en cascade sur etablissement_id.
      await service(`etablissement?id=eq.${id}`, { method: 'DELETE' })
    }
    for (const id of nes.users) {
      await fetch(`${URL_BASE}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` },
      })
    }
    const reste = await service(`etablissement?select=id&nom=like=*${marque}*`)
    const n = Array.isArray(reste.corps) ? reste.corps.length : 0
    if (n === 0) ok(`${nes.etablissements.length} établissement(s) et ${nes.users.length} compte(s) supprimés`)
    else ko(`${n} établissement(s) jetable(s) subsistent — à supprimer à la main`)
  } catch (e) {
    ko(`nettoyage incomplet : ${e?.message ?? e}. Cherchez « isolation-${marque} ».`)
  }
  }
}

console.log(
  echecs === 0
    ? '\nISOLATION RÉELLE : étanche, hook compris.'
    : `\n${echecs} problème(s). Ne pas mettre en service.`
)
// exitCode plutôt que exit() : on laisse les requêtes en vol se fermer.
process.exitCode = echecs === 0 ? 0 : 1
