'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBien } from '@/lib/hooks/use-bien'
import { BienDetailClient } from '@/components/biens/BienDetailClient'
import { EmptyState } from '@/components/ui/empty-state'
import { Home } from 'lucide-react'

export default function BienDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const bienId = params.id

  // Hook avec cache React Query
  const { data: bien, isLoading: bienLoading, error: bienError } = useBien({
    bienId,
    enabled: !!user && !!bienId,
  })

  // Redirect si pas authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  // Vérifier que le bien appartient à l'utilisateur
  useEffect(() => {
    if (bien && user && bien.userId !== user.id) {
      router.replace('/dashboard')
    }
  }, [bien, user, router])

  // Loading state
  if (authLoading || bienLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 lg:pt-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Error / not found
  if (bienError || !bien) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center pt-16 lg:pt-0">
        <EmptyState
          icon={Home}
          title="Bien introuvable"
          description="Ce bien n&apos;existe pas ou a été supprimé de votre portefeuille."
          action={{
            label: "Retour au dashboard",
            href: "/dashboard",
            variant: "outline"
          }}
        />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="animate-in fade-in duration-500">
      <BienDetailClient bien={bien} />
    </div>
  )
}
