'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'sonner'
import { PLANS } from '@/lib/stripe'

interface UpgradeButtonProps {
  targetPlan: 'essentiel' | 'premium'
  userId: string
}

export function UpgradeButton({ targetPlan, userId }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const plan = PLANS[targetPlan] ?? PLANS['gratuit']

  const handleUpgrade = async () => {
    if (!plan.priceId) {
      toast.error('Configuration de plan invalide')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      // Redirection vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de la création de la session de paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoadingButton
      onClick={handleUpgrade}
      loading={loading}
      loadingText="Chargement..."
      className={`w-full ${
        targetPlan === 'premium'
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
      } text-white`}
    >
      {`Passer à ${plan.name} (${plan.price}€/mois)`}
    </LoadingButton>
  )
}
