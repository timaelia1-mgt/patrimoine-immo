'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  currentPlan: string
  currentCount: number
  maxBiens: number
}

export function UpgradeModal({ open, onClose, currentPlan, currentCount, maxBiens }: UpgradeModalProps) {
  const router = useRouter()
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">🚀 Limite de biens atteinte</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Vous avez atteint la limite de <strong>{maxBiens} biens</strong> du plan <strong>{currentPlan}</strong>.
          </p>
          
          <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-indigo-900 dark:text-indigo-100">
              💡 Passez au plan supérieur pour gérer plus de biens et débloquer toutes les fonctionnalités !
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={() => {
                onClose()
                router.push('/abonnement')
              }}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Voir les plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
