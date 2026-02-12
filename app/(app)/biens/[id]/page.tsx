'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useBien } from '@/lib/hooks/use-bien'
import { BienDetailClient } from '@/components/biens/BienDetailClient'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Error / not found
  if (bienError || !bien) {
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

  if (!user) return null

  return <BienDetailClient bien={bien} />
}
