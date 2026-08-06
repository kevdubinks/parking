/**
 * Vérification de la logique de refus.
 *
 *   node --test src/lib/refus.test.mjs
 *
 * C'est la partie qu'il faut pouvoir vérifier sans base et sans
 * navigateur : confondre « injoignable » et « refusé » laisse des
 * enregistrements de clients bloqués sur un seul appareil sans que
 * personne ne soit prévenu.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estRefusServeur, messageRefus, plusAncien } from './refus.ts'

test('hors ligne : jamais un refus, quoi que porte l’erreur', () => {
  assert.equal(estRefusServeur({ code: '42501' }, false), false)
  assert.equal(estRefusServeur(new TypeError('Failed to fetch'), false), false)
})

test('coupure réseau en ligne : pas un refus non plus', () => {
  // fetch échoue sans code : le serveur n'a rien dit.
  assert.equal(estRefusServeur(new TypeError('Failed to fetch'), true), false)
  assert.equal(estRefusServeur(undefined, true), false)
  assert.equal(estRefusServeur(null, true), false)
  assert.equal(estRefusServeur({}, true), false)
  assert.equal(estRefusServeur({ code: '' }, true), false)
  // Un code numérique n'en est pas un pour PostgREST, qui les envoie
  // toujours en chaîne.
  assert.equal(estRefusServeur({ code: 500 }, true), false)
})

test('le serveur répond avec un code : c’est un refus', () => {
  assert.equal(estRefusServeur({ code: '42501' }, true), true)
  assert.equal(estRefusServeur({ code: 'PGRST301' }, true), true)
})

test('les causes courantes sont nommées, pas laissées en code brut', () => {
  assert.match(messageRefus({ code: '42501' }), /politique d’accès|politique d'accès/)
  assert.match(messageRefus({ code: '42501' }), /hook JWT/)
  assert.match(messageRefus({ code: 'PGRST301' }), /session a expiré/)
  assert.match(messageRefus({ code: '42703' }), /schéma de la base/)
})

test('un code inconnu reste lisible et transmet le détail', () => {
  const m = messageRefus({ code: '23514', message: 'plaque_check' })
  assert.match(m, /23514/)
  assert.match(m, /plaque_check/)
})

test('une erreur sans code ne fabrique pas de fausse explication', () => {
  assert.match(messageRefus(undefined), /code \?/)
})

test('le plus ancien horodatage est trouvé quel que soit l’ordre', () => {
  assert.equal(plusAncien([]), null)
  const a = '2026-08-06T09:00:00.000Z'
  const b = '2026-08-06T11:30:00.000Z'
  const c = '2026-08-05T23:15:00.000Z'
  assert.equal(plusAncien([a]), a)
  assert.equal(plusAncien([a, b, c]), c)
  assert.equal(plusAncien([c, b, a]), c)
})
