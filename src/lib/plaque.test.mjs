/**
 * Identité d'une plaque.
 *
 * C'est la fonction la plus lourde de conséquences du produit : deux
 * plaques qui se normalisent pareil sont, pour le registre, la même
 * voiture. Une collision fait disparaître un véhicule de la liste quand
 * l'autre sort, sans le moindre signal.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normaliser, estValide, afficher, dureeDepuis } from './plaque.ts'

test('la ponctuation et la casse ne changent pas la voiture', () => {
  const attendu = 'AB123CD'
  for (const saisie of ['AB-123-CD', 'ab 123 cd', 'AB123CD', ' ab.123.cd ', 'A B 1 2 3 C D']) {
    assert.equal(normaliser(saisie), attendu, saisie)
  }
})

test('les trémas allemands deviennent leur lettre de base, pas rien', () => {
  // Lörrach, Fürth, Mühldorf : ces plaques circulent, et en Corse au
  // mois d'août elles sont sur le parking. Avant correction, LÖ-AB-123
  // donnait LAB123 — la même chose que L-AB-123.
  assert.equal(normaliser('LÖ-AB 123'), 'LOAB123')
  assert.equal(normaliser('FÜ-XY 99'), 'FUXY99')
  assert.notEqual(normaliser('LÖ-AB 123'), normaliser('L-AB 123'))
  assert.equal(normaliser('L-AB 123'), 'LAB123')
})

test('les accents français aussi', () => {
  assert.equal(normaliser('éà-123-ç'), 'EA123C')
})

test('deux plaques distinctes ne se confondent jamais', () => {
  const distinctes = ['AB123CD', 'AB124CD', 'LOAB123', 'LAB123', 'MQP2094', 'MQP2095']
  const vues = new Set(distinctes.map((p) => normaliser(p)))
  assert.equal(vues.size, distinctes.length)
})

test('validation permissive : les formats étrangers passent', () => {
  for (const p of ['AB123CD', 'EJ815BZ', 'MQP2094', 'LOAB123', 'DK1234AB', 'AA1234']) {
    assert.equal(estValide(p), true, p)
  }
})

test('validation : bornes de longueur', () => {
  assert.equal(estValide('ABC'), false, '3 caractères')
  assert.equal(estValide('ABCD'), true, '4 caractères')
  assert.equal(estValide('A'.repeat(12)), true, '12 caractères')
  assert.equal(estValide('A'.repeat(13)), false, '13 caractères')
  assert.equal(estValide(''), false)
})

test('affichage : la saisie d’origine gagne quand elle correspond', () => {
  assert.equal(afficher('AB123CD', 'AB-123-CD'), 'AB-123-CD')
  assert.equal(afficher('LOAB123', 'LÖ-AB 123'), 'LÖ-AB 123')
})

test('affichage : une saisie qui ne correspond plus est ignorée', () => {
  // Sécurité : ne jamais afficher une plaque pour une autre.
  assert.equal(afficher('AB123CD', 'ZZ-999-ZZ'), 'AB-123-CD')
})

test('affichage : format français embelli, le reste laissé tel quel', () => {
  assert.equal(afficher('AB123CD'), 'AB-123-CD')
  assert.equal(afficher('MQP2094'), 'MQP2094')
})

test('durée : minutes, heures, jours', () => {
  const t = Date.parse('2026-08-09T12:00:00.000Z')
  const il_y_a = (ms) => new Date(t - ms).toISOString()
  assert.equal(dureeDepuis(il_y_a(0), t), '0 min')
  assert.equal(dureeDepuis(il_y_a(42 * 60_000), t), '42 min')
  assert.equal(dureeDepuis(il_y_a(192 * 60_000), t), '3 h 12')
  assert.equal(dureeDepuis(il_y_a(28 * 3600_000), t), '1 j 4 h')
})

test('durée : une horloge en avance ne produit pas de négatif', () => {
  // L'heure du geste vient du client ; deux appareils peuvent
  // diverger. « -3 min » au comptoir ferait douter de tout le reste.
  const t = Date.parse('2026-08-09T12:00:00.000Z')
  assert.equal(dureeDepuis(new Date(t + 60_000).toISOString(), t), '0 min')
})
