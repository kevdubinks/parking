/**
 * Fenêtre d'annulation : ce qui peut partir, et quand.
 *
 *   npm test
 *
 * Ce test existe parce que le bug qu'il verrouille était invisible :
 * l'annulation s'affichait six secondes et ne pouvait rien annuler
 * au-delà de la première demi-seconde, la sortie étant déjà partie au
 * serveur. Rien ne plantait, aucun message d'erreur — juste une
 * fonctionnalité décorative.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { envoyables, prochaineRetenue } from './journal.ts'

const T0 = Date.parse('2026-08-09T12:00:00.000Z')
const dans = (ms) => new Date(T0 + ms).toISOString()

const evenement = (id, retenu_jusqu) => ({
  id,
  type: 'SORTIE',
  plaque: 'AA111AA',
  survenu_le: dans(0),
  tentatives: 0,
  ...(retenu_jusqu ? { retenu_jusqu } : {}),
})

test('un événement sans retenue part tout de suite', () => {
  const e = [evenement('a')]
  assert.deepEqual(envoyables(e, T0).map((x) => x.id), ['a'])
})

test('une sortie retenue ne part pas pendant sa fenêtre', () => {
  const e = [evenement('sortie', dans(6000))]
  assert.deepEqual(envoyables(e, T0).map((x) => x.id), [])
  assert.deepEqual(envoyables(e, T0 + 5999).map((x) => x.id), [])
})

test('elle part dès la fenêtre écoulée, bornes comprises', () => {
  const e = [evenement('sortie', dans(6000))]
  assert.deepEqual(envoyables(e, T0 + 6000).map((x) => x.id), ['sortie'])
  assert.deepEqual(envoyables(e, T0 + 9000).map((x) => x.id), ['sortie'])
})

test('une entrée saisie pendant la retenue d’une sortie part sans attendre', () => {
  // Le cas réel : on sort une voiture, et on enregistre la suivante
  // dans la foulée. La seconde ne doit pas être retardée par la
  // première — sinon la file se met à traîner à chaque geste.
  const e = [evenement('sortie', dans(6000)), evenement('entree')]
  assert.deepEqual(envoyables(e, T0 + 1000).map((x) => x.id), ['entree'])
})

test('la prochaine échéance est la plus proche encore à venir', () => {
  const e = [evenement('a', dans(6000)), evenement('b', dans(2000)), evenement('c')]
  assert.equal(prochaineRetenue(e, T0), 2000)
  // Une échéance déjà passée ne compte plus.
  assert.equal(prochaineRetenue(e, T0 + 3000), 3000)
})

test('aucune retenue en cours : rien à programmer', () => {
  assert.equal(prochaineRetenue([], T0), null)
  assert.equal(prochaineRetenue([evenement('a')], T0), null)
  assert.equal(prochaineRetenue([evenement('a', dans(1000))], T0 + 5000), null)
})
