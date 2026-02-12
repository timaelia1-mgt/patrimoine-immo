'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBiens } from '@/lib/hooks/use-biens'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-400 text-lg font-medium mb-2">Erreur de chargement des biens</p>
          <p className="text-slate-400 text-sm">{biensError.message}</p>
        </div>
      </div>
    )
  }

  // User doit exister ici
  if (!user || !biens) return null

  return <DashboardClient biens={biens} userId={user.id} />
}
