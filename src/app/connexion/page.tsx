'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseNavigateur } from '@/lib/supabase/client'
import styles from '@/components/registre.module.css'

/**
 * Connexion.
 *
 * v1 : une seule utilisatrice, donc pas d'enrôlement d'appareil ni de
 * code partagé (CLAUDE.md § 8). Mais il faut bien une session : c'est
 * elle qui porte le claim `etablissement_id` sur lequel repose tout le
 * RLS. Sans session, la base ne renvoie rien — et c'est voulu.
 */
export default function Connexion() {
  const supabase = supabaseNavigateur()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })

    if (error) {
      // Message volontairement peu bavard : ne pas révéler si l'adresse
      // existe.
      setErreur('Identifiants incorrects.')
      setEnCours(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <main className={styles.connexion}>
      <h1 className={styles.titre}>Parking — Registre</h1>

      <form onSubmit={seConnecter}>
        <label className={styles.etiquette} htmlFor="email">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          className={styles.champTexte}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <label className={styles.etiquette} htmlFor="mdp">
          Mot de passe
        </label>
        <input
          id="mdp"
          type="password"
          className={styles.champTexte}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" className={styles.valider} disabled={enCours}>
          {enCours ? 'Connexion…' : 'Ouvrir le registre'}
        </button>
      </form>

      {erreur && <p className={styles.messageErreur}>{erreur}</p>}
    </main>
  )
}
