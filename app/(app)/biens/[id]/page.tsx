import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBien } from '@/lib/database'
import { logger } from '@/lib/logger'
import { BienDetailClient } from '@/components/biens/BienDetailClient'
import { Button } from '@/components/ui/button'

interface BienDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BienDetailPage({ params }: BienDetailPageProps) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/login')
    }

    const { id } = await params

    // Récupérer le bien (passer le client serveur)
    const bien = await getBien(id, supabase)

    if (!bien) {
      return (
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
              Bien introuvable
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                Retour au dashboard
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    // Vérifier que le bien appartient à l'utilisateur
    if (bien.userId !== user.id) {
      redirect('/dashboard')
    }

    return <BienDetailClient bien={bien} />
  } catch (error: unknown) {
    logger.error('[BienDetailPage] Erreur:', error)
    redirect('/dashboard')
  }
}
