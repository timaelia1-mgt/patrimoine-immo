'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBiens } from '@/lib/hooks/use-biens'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { ErrorState } from '@/components/ui/error-state'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Hook avec cache React Query
  const { data: biens, isLoading: biensLoading, error: biensError } = useBiens({
    userId: user?.id || '',
    enabled: !!user, // Ne fetch que si user existe
  })

  // Redirect si pas authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  // Loading state
  if (authLoading || biensLoading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (biensError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <ErrorState
          title="Impossible de charger vos biens"
          message="Une erreur s&apos;est produite lors du chargement de vos biens immobiliers."
          error={biensError}
          onRetry={() => window.location.reload()}
          retryText="Recharger la page"
        />
      </div>
    )
  }

  // User doit exister ici
  if (!user || !biens) return null

  return (
    <div className="animate-in fade-in duration-500">
      <DashboardClient biens={biens} userId={user.id} />
    </div>
  )
}
