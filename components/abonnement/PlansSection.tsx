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
  const [isAnnual, setIsAnnual] = useState(false)

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
    <div className="space-y-8">
      {/* Toggle Mensuel / Annuel */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>
          Mensuel
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            isAnnual ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
              isAnnual ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
          Annuel
        </span>
        {isAnnual && (
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
            -20%
          </span>
        )}
      </div>

      {/* Grille des plans */}
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
          isAnnual={isAnnual}
        />
        
        <PlanCard
          name={PLANS.essentiel.name}
          price={PLANS.essentiel.price}
          priceId={isAnnual ? PLANS.essentiel.priceIdYearly : PLANS.essentiel.priceId}
          maxBiens={PLANS.essentiel.maxBiens}
          features={PLANS.essentiel.features}
          isCurrentPlan={currentPlan === 'essentiel'}
          isPopular={true}
          onUpgrade={handleUpgrade}
          disabled={loading}
          loading={loadingPlan === PLANS.essentiel.name}
          isAnnual={isAnnual}
        />
        
        <PlanCard
          name={PLANS.premium.name}
          price={PLANS.premium.price}
          priceId={isAnnual ? PLANS.premium.priceIdYearly : PLANS.premium.priceId}
          maxBiens={PLANS.premium.maxBiens}
          features={PLANS.premium.features}
          isCurrentPlan={currentPlan === 'premium'}
          onUpgrade={handleUpgrade}
          disabled={loading}
          loading={loadingPlan === PLANS.premium.name}
          isAnnual={isAnnual}
        />
      </div>
    </div>
  )
}
