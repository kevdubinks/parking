'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ecrireReglages } from '@/lib/journal'
import { estRefusServeur, messageRefus } from '@/lib/refus'
import { supabaseNavigateur } from '@/lib/supabase/client'
import type { Etablissement } from '@/lib/types'
import styles from './registre.module.css'

/**
 * Réglages de l'établissement.
 *
 * Cet écran contredit les § 8 et § 10 du CLAUDE.md, qui écartent tout
 * écran d'administration et rappellent que c'est là que les produits
 * gonflent et meurent. Il existe sur décision explicite, après que
 * l'objection a été posée.
 *
 * La conséquence pratique de cette réserve : il n'expose QUE les
 * colonnes qui existent déjà dans `etablissement`, et pas un réglage de
 * plus. Toute demande d'ajout devrait repasser par la question du
 * § 10 — est-ce qu'au moins deux hôtels le régleraient différemment ?
 *
 * L'autorisation n'est pas décidée ici. Le RLS n'accorde l'UPDATE
 * qu'au rôle `direction` de l'établissement du jeton ; cet écran ne
 * fait que refléter ce que la base autorisera de toute façon. Masquer
 * le formulaire n'est pas une protection, c'est une politesse.
 */
export function Reglages() {
  const supabase = supabaseNavigateur()
  const [etab, setEtab] = useState<Etablissement | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState<{ texte: string; ton: 'ok' | 'erreur' } | null>(null)

  useEffect(() => {
    let vivant = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const meta = data.session?.user?.app_metadata as { role?: string } | undefined

      const { data: ligne, error } = await supabase
        .from('etablissement')
        .select('id,nom,places,chambre_obligatoire,conservation_jours,fuseau,afficher_occupation')
        .maybeSingle()

      if (!vivant) return
      setRole(meta?.role ?? 'reception')
      if (error || !ligne) {
        setMessage({
          texte: error
            ? `Lecture impossible : ${error.message}`
            : "Aucun établissement n'est rattaché à ce compte.",
          ton: 'erreur',
        })
      } else {
        setEtab(ligne as Etablissement)
      }
      setChargement(false)
    })()
    return () => {
      vivant = false
    }
  }, [supabase])

  const direction = role === 'direction'

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    if (!etab) return

    /**
     * Les bornes sont d'abord des contraintes CHECK en base. Sans ce
     * contrôle ici, une valeur hors bornes remontait le message brut de
     * Postgres — « violates check constraint
     * etablissement_places_check » — au comptoir d'un hôtel.
     */
    if (!Number.isInteger(etab.places) || etab.places < 1) {
      setMessage({ texte: 'Le nombre de places doit être un entier d’au moins 1.', ton: 'erreur' })
      return
    }
    if (
      !Number.isInteger(etab.conservation_jours) ||
      etab.conservation_jours < 1 ||
      etab.conservation_jours > 1095
    ) {
      setMessage({
        texte: 'La conservation doit être comprise entre 1 et 1095 jours.',
        ton: 'erreur',
      })
      return
    }

    setEnvoi(true)
    setMessage(null)

    const { data, error } = await supabase
      .from('etablissement')
      .update({
        nom: etab.nom.trim() || 'Parking',
        places: etab.places,
        chambre_obligatoire: etab.chambre_obligatoire,
        conservation_jours: etab.conservation_jours,
        afficher_occupation: etab.afficher_occupation,
      })
      .eq('id', etab.id)
      .select()

    setEnvoi(false)

    if (error) {
      // Même distinction qu'à la synchronisation : « refusé » et
      // « injoignable » n'appellent pas la même réaction. Afficher
      // « Enregistrement refusé : Failed to fetch » quand le wifi tombe
      // envoie chercher un problème de droits qui n'existe pas.
      setMessage(
        estRefusServeur(error, typeof navigator === 'undefined' || navigator.onLine)
          ? { texte: messageRefus(error), ton: 'erreur' }
          : {
              texte: 'Serveur injoignable. Les réglages n’ont pas été modifiés.',
              ton: 'erreur',
            }
      )
      return
    }

    // Zéro ligne touchée sans erreur, c'est le RLS qui a filtré : le
    // compte n'a pas le rôle direction. PostgREST ne le signale pas
    // autrement, et un « c'est enregistré » serait un mensonge.
    if (!data || data.length === 0) {
      setMessage({
        texte:
          'Aucune modification enregistrée : la modification des réglages est réservée à la direction.',
        ton: 'erreur',
      })
      return
    }

    // Le registre lit ses réglages depuis ce cache : sans cette écriture
    // il continuerait d'afficher les anciennes valeurs jusqu'à la
    // prochaine synchronisation réussie.
    await ecrireReglages(data[0] as Etablissement)
    setEtab(data[0] as Etablissement)
    setMessage({ texte: 'Réglages enregistrés.', ton: 'ok' })
  }

  const maj = <C extends keyof Etablissement>(champ: C, valeur: Etablissement[C]) =>
    setEtab((e) => (e ? { ...e, [champ]: valeur } : e))

  if (chargement) {
    return (
      <div className={styles.app}>
        <div className={styles.vide}>
          <div className={styles.videTexte}>Chargement des réglages…</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.entete}>
        <div className={styles.enteteReglages}>
          <div>
            <div className={styles.surTitre}>Réglages de l’établissement</div>
            <div className={styles.titreReglages}>{etab?.nom ?? '—'}</div>
          </div>
          <Link href="/" className={styles.retour}>
            Retour au registre
          </Link>
        </div>
      </header>

      <div className={styles.corpsReglages}>
        {!direction && (
          <div className={styles.bandeauReseau} role="status">
            <span className={styles.carre} aria-hidden="true" />
            <span>
              <strong>Lecture seule</strong> — la modification des réglages est réservée à la
              direction. Vous pouvez consulter les valeurs, pas les changer.
            </span>
          </div>
        )}

        {etab && (
          <form onSubmit={enregistrer} className={styles.formulaire}>
            <div className={styles.champ}>
              <label className={styles.etiquette} htmlFor="r-nom">
                Nom de l’établissement
              </label>
              <input
                id="r-nom"
                className={styles.champTexte}
                value={etab.nom}
                onChange={(e) => maj('nom', e.target.value)}
                maxLength={80}
                disabled={!direction}
              />
              <p className={styles.aide}>Affiché en haut du registre.</p>
            </div>

            <div className={styles.champ}>
              <label className={styles.etiquette} htmlFor="r-places">
                Nombre de places
              </label>
              <input
                id="r-places"
                className={styles.champTexte}
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                value={etab.places || ''}
                onChange={(e) => maj('places', Number(e.target.value))}
                disabled={!direction}
                required
              />
              <p className={styles.aide}>
                Sert au compteur, à la jauge et à l’alerte « parking complet ». Un parking
                complet n’empêche jamais d’enregistrer une entrée : refuser une voiture
                réellement garée rendrait le registre faux.
              </p>
            </div>

            <fieldset className={styles.groupe} disabled={!direction}>
              <legend className={styles.etiquette}>Compteur d’occupation</legend>
              <label className={styles.bascule}>
                <input
                  type="checkbox"
                  checked={etab.afficher_occupation}
                  onChange={(e) => maj('afficher_occupation', e.target.checked)}
                />
                <span>Afficher le compteur et la jauge</span>
              </label>
              <p className={styles.aide}>
                À décocher si la réception n’est pas tenue en permanence. Des voitures
                entreraient alors sans être saisies, et le compteur mentirait — un chiffre faux
                est pire que pas de chiffre.
              </p>
            </fieldset>

            <fieldset className={styles.groupe} disabled={!direction}>
              <legend className={styles.etiquette}>Numéro de chambre</legend>
              <label className={styles.bascule}>
                <input
                  type="checkbox"
                  checked={etab.chambre_obligatoire}
                  onChange={(e) => maj('chambre_obligatoire', e.target.checked)}
                />
                <span>Obligatoire à l’enregistrement</span>
              </label>
              <p className={styles.aide}>
                À n’activer que si l’hôtel n’accueille aucun visiteur extérieur. Sinon un
                véhicule sans chambre est signalé, jamais bloqué.
              </p>
            </fieldset>

            <div className={styles.champ}>
              <label className={styles.etiquette} htmlFor="r-conservation">
                Conservation des données (jours)
              </label>
              <input
                id="r-conservation"
                className={styles.champTexte}
                type="number"
                inputMode="numeric"
                min={1}
                max={1095}
                value={etab.conservation_jours || ''}
                onChange={(e) => maj('conservation_jours', Number(e.target.value))}
                disabled={!direction}
                required
              />
              <p className={styles.aide}>
                Une plaque d’immatriculation est une donnée personnelle. Les véhicules sortis
                depuis plus longtemps sont supprimés chaque nuit ; une voiture encore garée
                n’est jamais purgée. Les sauvegardes automatiques, elles, conservent plus
                longtemps : ce réglage ne les couvre pas.
              </p>
            </div>

            {direction && (
              <button type="submit" className={styles.valider} disabled={envoi}>
                {envoi ? 'Enregistrement…' : 'Enregistrer les réglages'}
              </button>
            )}
          </form>
        )}

        {message && (
          <p
            className={message.ton === 'ok' ? styles.messageSucces : styles.messageEchec}
            role="status"
          >
            {message.texte}
          </p>
        )}
      </div>
    </div>
  )
}
