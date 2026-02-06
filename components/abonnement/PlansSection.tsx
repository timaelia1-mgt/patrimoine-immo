'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { PLANS, PlanType } from '@/lib/stripe'
import { PlanCard } from './PlanCard'

interface PlansSectionProps {
  currentPlan: PlanType
  userId: string
}

export function PlansSection({ currentPlan, userId }: PlansSectionProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = useCallback(async (priceId: string, planName: string) => {
    try {
      setLoading(true)
      setLoadingPlan(planName)

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      window.location.href = data.url
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de la mise à niveau')
      setLoading(false)
      setLoadingPlan(null)
    }
  }, [userId])

  return (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
      <PlanCard
        name={PLANS.gratuit.name}
        price={PLANS.gratuit.price}
        priceId={PLANS.gratuit.priceId}
        maxBiens={PLANS.gratuit.maxBiens}
        features={PLANS.gratuit.features}
        isCurrentPlan={currentPlan === 'gratuit'}
        onUpgrade={handleUpgrade}
        disabled={loading}
        loading={loadingPlan === PLANS.gratuit.name}
      />
      
      <PlanCard
        name={PLANS.essentiel.name}
        price={PLANS.essentiel.price}
        priceId={PLANS.essentiel.priceId}
        maxBiens={PLANS.essentiel.maxBiens}
        features={PLANS.essentiel.features}
        isCurrentPlan={currentPlan === 'essentiel'}
        isPopular={true}
        onUpgrade={handleUpgrade}
        disabled={loading}
        loading={loadingPlan === PLANS.essentiel.name}
      />
      
      <PlanCard
        name={PLANS.premium.name}
        price={PLANS.premium.price}
        priceId={PLANS.premium.priceId}
        maxBiens={PLANS.premium.maxBiens}
        features={PLANS.premium.features}
        isCurrentPlan={currentPlan === 'premium'}
        onUpgrade={handleUpgrade}
        disabled={loading}
        loading={loadingPlan === PLANS.premium.name}
      />
    </div>
  )
}
