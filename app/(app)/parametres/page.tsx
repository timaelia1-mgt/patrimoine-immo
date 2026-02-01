import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/database'
import { ParametresClient } from '@/components/parametres/ParametresClient'

// Désactiver le cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ParametresPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/login')
    }

    // Récupérer le profil utilisateur (passer le client serveur)
    const profile = await getUserProfile(user.id, supabase)

    return (
      <ParametresClient 
        profile={profile}
        userEmail={user.email || ""}
      />
    )
  } catch (error) {
    console.error('Parametres error:', error)
    redirect('/login')
  }
}
