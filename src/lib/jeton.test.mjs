/**
 * Lecture des claims du jeton.
 *
 * Ce test verrouille le défaut le plus coûteux du projet : l'identité
 * était lue dans `session.user.app_metadata`, qui ne porte jamais les
 * claims du hook. L'application se croyait non rattachée, et aucune
 * entrée ne pouvait être enregistrée — sur une base pourtant
 * parfaitement configurée.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { claimsDuJeton } from './jeton.ts'

/** Fabrique un jeton d'accès de la forme entete.charge.signature. */
const jeton = (charge) => {
  const b64 = (o) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(charge)}.signature-non-verifiee`
}

test('les claims du hook sont lus', () => {
  // Charge réelle observée sur le projet, réduite à l'essentiel.
  const t = jeton({
    sub: '1334ef43-0d12-438a-a42d-a99689befe03',
    role: 'authenticated',
    app_metadata: {
      etablissement_id: 'ad093d3c-7f96-43e1-ba08-40223ca8f9ae',
      provider: 'email',
      providers: ['email'],
      role: 'direction',
    },
  })
  assert.deepEqual(claimsDuJeton(t), {
    etablissementId: 'ad093d3c-7f96-43e1-ba08-40223ca8f9ae',
    role: 'direction',
  })
})

test('un jeton sans hook branché ne rattache à rien', () => {
  // C'est exactement ce que contient app_metadata quand le hook n'est
  // pas activé : le fournisseur, et rien d'autre.
  const t = jeton({ sub: 'x', app_metadata: { provider: 'email', providers: ['email'] } })
  assert.deepEqual(claimsDuJeton(t), { etablissementId: null, role: null })
})

test('les accents et les caractères non-ASCII ne cassent pas le décodage', () => {
  // Le décodage passe par des octets, pas par des caractères : un nom
  // d'établissement accentué dans un claim ne doit rien casser.
  const t = jeton({ app_metadata: { etablissement_id: 'abc', role: 'direction' }, nom: 'Hôtel des Lucioles' })
  assert.equal(claimsDuJeton(t).role, 'direction')
})

test('rembourrage base64url absent : décodé quand même', () => {
  // Les jetons réels n'ont pas de « = » final ; une charge dont la
  // longueur n'est pas multiple de 4 doit passer.
  for (const bourrage of ['a', 'ab', 'abc', 'abcd']) {
    const t = jeton({ app_metadata: { etablissement_id: bourrage, role: 'direction' } })
    assert.equal(claimsDuJeton(t).etablissementId, bourrage)
  }
})

test('on échoue fermé sur tout ce qui n’est pas un jeton', () => {
  for (const mauvais of [null, undefined, '', 'pas-un-jeton', 'a.b', 'a.b.c.d', 'a.!!!.c']) {
    assert.deepEqual(claimsDuJeton(mauvais), { etablissementId: null, role: null }, String(mauvais))
  }
})

test('un claim d’un type inattendu est ignoré, pas propagé', () => {
  const t = jeton({ app_metadata: { etablissement_id: 42, role: { x: 1 } } })
  assert.deepEqual(claimsDuJeton(t), { etablissementId: null, role: null })
})
