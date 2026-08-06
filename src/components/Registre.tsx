'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DELAI_ANNULATION, config } from '@/lib/config'
import { afficher, dureeDepuis, estValide, normaliser } from '@/lib/plaque'
import { useRegistre } from '@/lib/useRegistre'
import { BarreAnnulation } from './BarreAnnulation'
import { LigneVehicule } from './LigneVehicule'
import styles from './registre.module.css'

/**
 * L'écran unique.
 *
 * Le champ plaque fait deux choses en même temps — chercher et
 * enregistrer — parce que demander à quelqu'un de choisir entre les deux
 * avant de taper coûte une décision, et que la décision coûte des
 * secondes qu'on n'a pas au comptoir.
 */
export function Registre() {
  const registre = useRegistre()
  const [plaqueSaisie, setPlaqueSaisie] = useState('')
  const [chambre, setChambre] = useState('')
  const [annulation, setAnnulation] = useState<{ id: string; texte: string } | null>(null)
  const [messageAnnulation, setMessageAnnulation] = useState<string | null>(null)
  const champPlaque = useRef<HTMLInputElement>(null)
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Les durées affichées vieillissent : on redessine régulièrement.
  const [, redessiner] = useState(0)
  useEffect(() => {
    const t = setInterval(() => redessiner((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => () => {
    if (minuterie.current) clearTimeout(minuterie.current)
  }, [])

  const plaque = normaliser(plaqueSaisie)
  const presents = registre.presents

  const resultats = useMemo(
    () => (plaque ? presents.filter((v) => v.plaque.includes(plaque)) : presents),
    [plaque, presents]
  )

  const dejaLa = useMemo(() => presents.find((v) => v.plaque === plaque), [plaque, presents])
  const manqueChambre = config.chambreObligatoire && !chambre.trim()
  const peutEnregistrer = estValide(plaque) && !dejaLa && !manqueChambre && !!registre.identite

  const indice = (() => {
    if (!plaque) return "Tapez une plaque pour la chercher ou l'enregistrer."
    if (dejaLa) {
      const ou = dejaLa.chambre ? `chambre ${dejaLa.chambre}` : 'sans chambre'
      return `Déjà sur le parking — ${ou}, depuis ${dureeDepuis(dejaLa.entree_le)}.`
    }
    if (!estValide(plaque)) return 'Continuez la saisie…'
    if (manqueChambre) return 'Le numéro de chambre est obligatoire dans cet établissement.'
    if (!chambre.trim()) return 'Sans numéro de chambre, ce véhicule sera marqué sans chambre.'
    return 'Prêt à enregistrer.'
  })()

  const enregistrer = useCallback(async () => {
    if (!peutEnregistrer) return
    await registre.entrer(plaqueSaisie, chambre)
    setPlaqueSaisie('')
    setChambre('')
    champPlaque.current?.focus()
  }, [peutEnregistrer, registre, plaqueSaisie, chambre])

  const sortir = useCallback(
    async (plaqueSortante: string) => {
      const vehicule = presents.find((v) => v.plaque === plaqueSortante)
      const id = await registre.sortir(plaqueSortante)
      if (!id) return

      setMessageAnnulation(null)
      setAnnulation({
        id,
        texte: `Sortie de ${afficher(plaqueSortante, vehicule?.plaque_saisie)}`,
      })
      if (minuterie.current) clearTimeout(minuterie.current)
      minuterie.current = setTimeout(() => setAnnulation(null), DELAI_ANNULATION)
    },
    [presents, registre]
  )

  const annuler = useCallback(async () => {
    if (!annulation) return
    const retire = await registre.annulerSortie(annulation.id)
    setAnnulation(null)
    if (!retire) {
      // Déjà parti au serveur : on ne réécrit pas le journal, on le dit.
      setMessageAnnulation(
        "Sortie déjà enregistrée. Ré-enregistrez l'entrée du véhicule pour le remettre sur le parking."
      )
    }
  }, [annulation, registre])

  const occupees = presents.length
  const libres = Math.max(0, config.places - occupees)
  const complet = occupees >= config.places
  const sansChambre = presents.filter((v) => !v.chambre).length

  return (
    <div className={styles.app}>
      <header className={styles.entete}>
        <div className={styles.enteteHaut}>
          <div>
            <div className={styles.lieu}>{config.nom}</div>
            {config.afficherOccupation ? (
              <div className={styles.compteur}>
                {occupees}
                <small>
                  /{config.places} places
                </small>
              </div>
            ) : (
              <div className={styles.compteur}>
                {occupees}
                <small> véhicule{occupees > 1 ? 's' : ''}</small>
              </div>
            )}
          </div>
        </div>

        {config.afficherOccupation && (
          <>
            <div className={`${styles.jauge} ${complet ? styles.jaugePleine : ''}`}>
              <span
                style={{ width: `${Math.min(100, Math.round((occupees / config.places) * 100))}%` }}
              />
            </div>
            <div className={styles.etat}>
              <span>
                {complet
                  ? 'Parking complet'
                  : `${libres} place${libres > 1 ? 's' : ''} libre${libres > 1 ? 's' : ''}`}
              </span>
              <span>{sansChambre ? `${sansChambre} sans chambre` : ''}</span>
            </div>
          </>
        )}
      </header>

      {registre.reseau === 'hors-ligne' && (
        <div className={styles.reseau} role="status">
          <span className={styles.pastille} aria-hidden="true" />
          <span>
            Hors ligne — la saisie continue.
            {registre.enAttente > 0 &&
              ` ${registre.enAttente} en attente d'envoi.`}
          </span>
        </div>
      )}

      <div className={styles.saisie}>
        <div className={styles.champs}>
          <div className={styles.champPlaque}>
            <label className={styles.etiquette} htmlFor="plaque">
              Plaque
            </label>
            <input
              id="plaque"
              ref={champPlaque}
              className={styles.entree}
              value={plaqueSaisie}
              onChange={(e) => setPlaqueSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void enregistrer()
              }}
              placeholder="AB123CD"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className={styles.champChambre}>
            <label className={styles.etiquette} htmlFor="chambre">
              Chambre{' '}
              {config.chambreObligatoire && (
                <span className={styles.obligatoire} aria-hidden="true">
                  •
                </span>
              )}
            </label>
            <input
              id="chambre"
              className={styles.entree}
              value={chambre}
              onChange={(e) => setChambre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void enregistrer()
              }}
              placeholder="—"
              autoComplete="off"
              inputMode="numeric"
              required={config.chambreObligatoire}
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.valider}
          onClick={() => void enregistrer()}
          disabled={!peutEnregistrer}
        >
          Enregistrer l&apos;entrée
        </button>

        <div className={styles.indice} aria-live="polite">
          {messageAnnulation ?? registre.erreur ?? indice}
        </div>
      </div>

      <div className={styles.liste}>
        <div className={styles.titreListe}>
          <span>{plaque ? 'Résultats' : 'Véhicules présents'}</span>
          <span>{resultats.length || ''}</span>
        </div>

        {!registre.pret ? (
          <div className={styles.vide}>Chargement du registre…</div>
        ) : resultats.length === 0 ? (
          <div className={styles.vide}>
            {plaque
              ? `Aucun véhicule avec ${afficher(plaque)} sur le parking. Enregistrez son entrée ci-dessus.`
              : 'Le parking est vide. Enregistrez la première entrée.'}
          </div>
        ) : (
          resultats.map((v) => (
            <LigneVehicule key={v.plaque} vehicule={v} onSortie={(p) => void sortir(p)} />
          ))
        )}
      </div>

      <BarreAnnulation
        texte={annulation?.texte ?? ''}
        visible={!!annulation}
        onAnnuler={() => void annuler()}
      />
    </div>
  )
}
