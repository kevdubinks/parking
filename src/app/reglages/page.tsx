import { redirect } from 'next/navigation'
import { Reglages } from '@/components/Reglages'
import { supabaseServeur } from '@/lib/supabase/server'

// Réglages propres à une session : rien à mettre en cache.
export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  // Le filtrage par rôle n'est pas fait ici : c'est le RLS qui refuse
  // l'écriture au rôle `reception`. L'écran s'affiche en lecture seule
  // pour tout le monde, ce qui évite de faire dépendre une protection
  // d'un test côté application.
  return <Reglages />
}
