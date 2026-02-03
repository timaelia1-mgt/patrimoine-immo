'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/stripe'

interface UpgradeButtonProps {
  targetPlan: 'essentiel' | 'premium'
  userId: string
}

export function UpgradeButton({ targetPlan, userId }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const plan = PLANS[targetPlan]

  const handleUpgrade = async () => {
    console.log('[UpgradeButton] targetPlan:', targetPlan)
    console.log('[UpgradeButton] userId:', userId)
    console.log('[UpgradeButton] plan:', plan)
    console.log('[UpgradeButton] plan.priceId:', plan.priceId)
    
    setLoading(true)
    try {
      const requestBody = {
        priceId: plan.priceId,
        userId,
      }
      console.log('[UpgradeButton] Request body:', requestBody)
      
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('[UpgradeButton] Response status:', response.status)
      const result = await response.json()
      console.log('[UpgradeButton] Response data:', result)

      const { url, error } = result

      if (error) {
        console.error('[UpgradeButton] Erreur:', error)
        alert(error)
        return
      }

      // Redirection vers Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('[UpgradeButton] Erreur catch:', err)
      alert('Erreur lors de la création de la session de paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className={`w-full ${
        targetPlan === 'premium'
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
      } text-white`}
    >
      {loading 
        ? 'Chargement...' 
        : `Passer à ${plan.name} (${plan.price}€/mois)`
      }
    </Button>
  )
}
