'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DELAI_ANNULATION, config } from '@/lib/config'
import { afficher, dureeDepuis, estValide, normaliser } from '@/lib/plaque'
import { useRegistre } from '@/lib/useRegistre'
import { BarreAnnulation } from './BarreAnnulation'
import { Jauge } from './Jauge'
import { LigneVehicule } from './LigneVehicule'
import styles from './registre.module.css'

/**
 * L'écran unique — direction A « Signalétique ».
 *
 * Le champ plaque fait deux choses en même temps — chercher et
 * enregistrer — parce que demander à quelqu'un de choisir entre les deux
 * avant de taper coûte une décision, et que la décision coûte des
 * secondes qu'on n'a pas au comptoir.
 *
 * De haut en bas : compteur, bandeaux d'état, liste (seule zone qui
 * défile), barre d'annulation, saisie collée en bas. La main ne quitte
 * jamais le tiers bas de l'écran.
 */

/** Paliers de taille du champ : une plaque longue reste entière. */
function classePlaque(saisie: string): string {
  const n = saisie.trim().length
  if (n >= 13) return styles.plaqueTresLongue
  if (n >= 11) return styles.plaqueLongue
  return ''
}

export function Registre() {
  const registre = useRegistre()
  const [plaqueSaisie, setPlaqueSaisie] = useState('')
  const [chambre, setChambre] = useState('')
  const [annulation, setAnnulation] = useState<{
    id: string
    plaque: string
    debut: number
  } | null>(null)
  const [messageAnnulation, setMessageAnnulation] = useState<string | null>(null)
  const champPlaque = useRef<HTMLInputElement>(null)
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Les durées affichées vieillissent : on redessine régulièrement.
  const [, redessiner] = useState(0)
  useEffect(() => {
    const t = setInterval(() => redessiner((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current)
    },
    []
  )

  const plaque = normaliser(plaqueSaisie)
  const presents = registre.presents

  const resultats = useMemo(
    () => (plaque ? presents.filter((v) => v.plaque.includes(plaque)) : presents),
    [plaque, presents]
  )

  const dejaLa = useMemo(() => presents.find((v) => v.plaque === plaque), [plaque, presents])
  const manqueChambre = config.chambreObligatoire && !chambre.trim()
  const peutEnregistrer = estValide(plaque) && !dejaLa && !manqueChambre && !!registre.identite

  const occupees = presents.length
  const libres = Math.max(0, config.places - occupees)
  const complet = occupees >= config.places

  /* Le message dit toujours la raison. Le bouton grisé n'est jamais la
     seule explication. */
  const message: { texte: string; ton?: 'alerte' | 'danger' } = (() => {
    if (messageAnnulation) return { texte: messageAnnulation, ton: 'alerte' }
    if (registre.erreur) return { texte: registre.erreur, ton: 'danger' }
    if (!plaque) return { texte: 'Tapez une plaque pour la chercher ou l’enregistrer.' }
    if (dejaLa) {
      const ou = dejaLa.chambre ? `chambre ${dejaLa.chambre}` : 'sans chambre'
      return {
        texte: `Déjà dans le parking depuis ${dureeDepuis(dejaLa.entree_le)} — ${ou}. Ligne signalée ci-dessus.`,
        ton: 'alerte',
      }
    }
    if (!estValide(plaque)) return { texte: 'Continuez la saisie…' }
    if (manqueChambre) {
      return {
        texte: 'Le numéro de chambre est obligatoire dans cet établissement.',
        ton: 'alerte',
      }
    }
    if (!chambre.trim()) {
      return { texte: 'Nouveau véhicule, sans chambre — Entrée pour enregistrer.' }
    }
    return { texte: 'Nouveau véhicule — Entrée pour enregistrer.' }
  })()

  const enregistrer = useCallback(async () => {
    if (!peutEnregistrer) return
    // Le champ est vidé et garde le focus AVANT la réponse du serveur :
    // la voiture suivante peut être tapée immédiatement. La ligne porte
    // seule la mention « en attente ».
    const saisie = plaqueSaisie
    const ch = chambre
    setPlaqueSaisie('')
    setChambre('')
    setMessageAnnulation(null)
    champPlaque.current?.focus()
    await registre.entrer(saisie, ch)
  }, [peutEnregistrer, registre, plaqueSaisie, chambre])

  const sortir = useCallback(
    async (plaqueSortante: string) => {
      const vehicule = presents.find((v) => v.plaque === plaqueSortante)
      const id = await registre.sortir(plaqueSortante)
      if (!id) return

      setMessageAnnulation(null)
      setAnnulation({
        id,
        plaque: afficher(plaqueSortante, vehicule?.plaque_saisie),
        debut: Date.now(),
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
        'Sortie déjà envoyée. Ré-enregistrez l’entrée du véhicule pour le remettre dans le parking.'
      )
    }
    champPlaque.current?.focus()
  }, [annulation, registre])

  return (
    <div className={styles.app}>
      <header className={styles.entete}>
        <div className={styles.surTitre}>{config.nom}</div>
        <div className={styles.mesure}>
          <div className={styles.compteur}>
            {occupees}
            {config.afficherOccupation && (
              <span className={styles.capacite}> / {config.places}</span>
            )}
          </div>
          {config.afficherOccupation && (
            <div className={styles.mesureDroite}>
              <Jauge occupees={occupees} places={config.places} />
              <div className={styles.restantes}>
                {complet
                  ? 'aucune place libre'
                  : `${libres} place${libres > 1 ? 's' : ''} libre${libres > 1 ? 's' : ''}`}
              </div>
            </div>
          )}
        </div>
      </header>

      {config.afficherOccupation && complet && (
        <div className={styles.bandeauComplet} role="status">
          <strong>Parking complet</strong> — enregistrez une sortie avant une nouvelle
          entrée.
        </div>
      )}

      {registre.reseau === 'hors-ligne' && (
        <div className={styles.bandeauReseau} role="status">
          <span className={styles.carre} aria-hidden="true" />
          <span>
            <strong>Hors ligne</strong>
            {registre.enAttente > 0 &&
              ` — ${registre.enAttente} enregistrement${registre.enAttente > 1 ? 's' : ''} en attente d’envoi`}
            . Continuez normalement, l’envoi se fait au retour du réseau.
          </span>
        </div>
      )}

      <div className={styles.liste}>
        {!registre.pret ? (
          <div className={styles.vide}>
            <div className={styles.videTexte}>Chargement du registre…</div>
          </div>
        ) : resultats.length === 0 ? (
          plaque ? (
            <div className={styles.vide}>
              <div className={styles.videSurTitre}>Pas dans le parking</div>
              <div className={styles.videPlaque}>{plaqueSaisie.trim()}</div>
              <div className={styles.videTexte} style={{ marginTop: 9 }}>
                Le bouton ci-dessous enregistre son entrée.
              </div>
            </div>
          ) : (
            <div className={styles.vide}>
              <div className={styles.videTitre}>Aucun véhicule dans le parking</div>
              <div className={styles.videTexte}>
                Tapez une plaque dans le champ ci-dessous pour enregistrer la première
                entrée.
              </div>
            </div>
          )
        ) : (
          resultats.map((v) => (
            <LigneVehicule
              key={v.plaque}
              vehicule={v}
              marquee={!!dejaLa && v.plaque === dejaLa.plaque}
              onSortie={(p) => void sortir(p)}
            />
          ))
        )}
      </div>

      {annulation && (
        <BarreAnnulation
          plaque={annulation.plaque}
          debut={annulation.debut}
          duree={DELAI_ANNULATION}
          onAnnuler={() => void annuler()}
        />
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
              className={`${styles.entreePlaque} ${classePlaque(plaqueSaisie)} ${
                dejaLa ? styles.entreePlaqueDoublon : ''
              }`}
              value={plaqueSaisie}
              /* Majuscules forcées, mais tirets et espaces conservés :
                 les plaques étrangères ne sont pas normalisées de force.
                 La comparaison, elle, ignore tout sauf lettres et
                 chiffres. */
              onChange={(e) => setPlaqueSaisie(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void enregistrer()
              }}
              placeholder="AB-123-CD"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={16}
              aria-describedby="message-saisie"
              autoFocus
            />
          </div>

          <div className={styles.champChambre}>
            <label className={styles.etiquette} htmlFor="chambre">
              Chambre{' '}
              {config.chambreObligatoire && (
                <span className={styles.champObligatoire} aria-hidden="true">
                  •
                </span>
              )}
            </label>
            <input
              id="chambre"
              className={styles.entreeChambre}
              value={chambre}
              onChange={(e) => setChambre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void enregistrer()
              }}
              placeholder="—"
              autoComplete="off"
              inputMode="numeric"
              maxLength={8}
              required={config.chambreObligatoire}
            />
          </div>
        </div>

        <div
          id="message-saisie"
          className={`${styles.message} ${
            message.ton === 'alerte'
              ? styles.messageAlerte
              : message.ton === 'danger'
                ? styles.messageDanger
                : ''
          }`}
          aria-live="polite"
        >
          {message.texte}
        </div>

        <button
          type="button"
          className={styles.valider}
          onClick={() => void enregistrer()}
          disabled={!peutEnregistrer}
        >
          Enregistrer l’entrée
        </button>
      </div>
    </div>
  )
}
