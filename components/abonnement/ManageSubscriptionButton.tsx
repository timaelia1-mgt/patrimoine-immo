'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ManageSubscriptionButtonProps {
  hasActiveSubscription: boolean
  className?: string
}

export function ManageSubscriptionButton({
  hasActiveSubscription,
  className,
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ouverture du portail')
      }

      // Rediriger vers le Customer Portal Stripe
      window.location.href = data.url
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de l\'ouverture du portail')
      setLoading(false)
    }
  }

  // Ne pas afficher le bouton si pas d'abonnement actif
  if (!hasActiveSubscription) {
    return null
  }

  return (
    <Button
      onClick={handleManageSubscription}
      disabled={loading}
      variant="outline"
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Gérer mon abonnement
        </>
      )}
    </Button>
  )
}
