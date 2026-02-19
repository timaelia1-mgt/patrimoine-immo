'use client'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface FeatureLockedModalProps {
  open: boolean
  onClose: () => void
  featureName: string
  featureDescription: string
}

export function FeatureLockedModal({ 
  open, 
  onClose, 
  featureName,
  featureDescription 
}: FeatureLockedModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <DialogTitle className="text-xl">Fonctionnalité Premium</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            <strong>{featureName}</strong> est une fonctionnalité réservée aux plans payants.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              💎 {featureDescription}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Avec un plan payant, vous débloquez :
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>✓ Export Excel/PDF complet</li>
              <li>✓ Génération de quittances PDF</li>
              <li>✓ Envoi automatique par email</li>
              <li>✓ Rapport annuel détaillé</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            <Button
              onClick={() => {
                onClose()
                router.push('/abonnement')
              }}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              Voir les plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
