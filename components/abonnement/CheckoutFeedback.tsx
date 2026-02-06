'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function CheckoutFeedbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCancelMessage, setShowCancelMessage] = useState(false)
  const [verifyingSubscription, setVerifyingSubscription] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setShowSuccessMessage(true)
      setVerifyingSubscription(true)

      toast.success('Abonnement activé avec succès !', {
        description: 'Votre paiement a été confirmé. Profitez de toutes les fonctionnalités.',
        duration: 5000,
      })

      // Vérifier le profil après 2 secondes pour voir si le webhook a été reçu
      setTimeout(async () => {
        try {
          await fetch('/api/user/profile')
        } catch {
          // Erreur silencieuse - le webhook n'a peut-être pas encore été traité
        } finally {
          setVerifyingSubscription(false)
        }
      }, 2000)

      // Nettoyer l'URL après 5 secondes
      setTimeout(() => {
        window.history.replaceState({}, '', '/abonnement')
      }, 5000)
    }

    if (canceled === 'true') {
      setShowCancelMessage(true)

      toast.error('Paiement annulé', {
        description: 'Vous pouvez réessayer à tout moment.',
        duration: 5000,
      })

      // Nettoyer l'URL après 5 secondes
      setTimeout(() => {
        window.history.replaceState({}, '', '/abonnement')
        setShowCancelMessage(false)
      }, 5000)
    }
  }, [searchParams])

  if (!showSuccessMessage && !showCancelMessage && !verifyingSubscription) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Loader pendant la vérification */}
      {verifyingSubscription && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Vérification de votre abonnement en cours...
          </p>
        </div>
      )}

      {/* Message de succès */}
      {showSuccessMessage && !verifyingSubscription && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                🎉 Paiement confirmé !
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Votre abonnement a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de votre nouveau plan.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => router.push('/dashboard')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Retour au Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessMessage(false)
                    window.history.replaceState({}, '', '/abonnement')
                  }}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-700 hover:bg-green-100 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-900/40"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message d'annulation */}
      {showCancelMessage && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Paiement annulé
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Votre paiement a été annulé. Aucun montant n'a été débité. Vous pouvez réessayer à tout moment.
              </p>
              <Button
                onClick={() => {
                  setShowCancelMessage(false)
                  window.history.replaceState({}, '', '/abonnement')
                }}
                variant="outline"
                size="sm"
                className="mt-3 border-orange-600 text-orange-700 hover:bg-orange-100 dark:border-orange-400 dark:text-orange-300 dark:hover:bg-orange-900/40"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CheckoutFeedback() {
  return (
    <Suspense fallback={null}>
      <CheckoutFeedbackContent />
    </Suspense>
  )
}
