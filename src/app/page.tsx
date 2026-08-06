import { redirect } from 'next/navigation'
import { Registre } from '@/components/Registre'
import { supabaseServeur } from '@/lib/supabase/server'

// Le registre est propre à une session : rien à mettre en cache.
export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await supabaseServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  return <Registre />
}
