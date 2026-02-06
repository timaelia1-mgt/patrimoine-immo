"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { BienFormDialog } from "@/components/biens/BienFormDialog"
import { getUserProfile, getBiens } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"
import { PLANS } from "@/lib/stripe"
import type { PlanType } from "@/lib/stripe"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus } from "lucide-react"

// Lazy-load du modal pour réduire le bundle initial
const UpgradeModal = dynamic(
  () => import("@/components/modals/UpgradeModal").then(mod => ({ default: mod.UpgradeModal })),
  { ssr: false }
)

interface DashboardClientProps {
  biens: any[]
  stats: any
  planType: PlanType
  maxBiens: number | null
}

export function DashboardClient({ biens, stats, planType, maxBiens }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanType>(planType)
  const [biensCount, setBiensCount] = useState(biens.length)
  const [currentMaxBiens, setCurrentMaxBiens] = useState<number | null>(maxBiens)

  // Synchroniser avec les props serveur
  useEffect(() => {
    setUserPlan(planType)
    setBiensCount(biens.length)
    setCurrentMaxBiens(maxBiens)
  }, [planType, biens.length, maxBiens])

  // Vérifier si on peut créer un bien
  const canCreateBien = currentMaxBiens === null || biensCount < currentMaxBiens
  const remainingBiens = currentMaxBiens === null ? null : Math.max(0, currentMaxBiens - biensCount)

  // Vérifier si on doit ouvrir le dialog depuis l'URL
  useEffect(() => {
    const handleOpenDialog = () => {
      if (!canCreateBien) {
        setUpgradeModalOpen(true)
        return
      }
      
      setDialogOpen(true)
    }

    try {
      const addParam = searchParams?.get("add")
      if (addParam === "true") {
        handleOpenDialog()
        // Nettoyer l'URL après un court délai
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete("add")
          window.history.replaceState({}, "", url.pathname + url.search)
        }, 100)
      }
    } catch (error) {
      // Fallback si useSearchParams ne fonctionne pas
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        if (params.get("add") === "true") {
          handleOpenDialog()
          setTimeout(() => {
            const url = new URL(window.location.href)
            url.searchParams.delete("add")
            window.history.replaceState({}, "", url.pathname + url.search)
          }, 100)
        }
      }
    }
  }, [searchParams, canCreateBien])

  const handleSuccess = () => {
    // 1. Fermer le dialog d'abord
    setDialogOpen(false)
    
    // 2. Refresh des données pour afficher le nouveau bien
    router.refresh()
  }

  return (
    <>
      {/* Indicateurs de limite de biens */}
      {biens.length > 0 && (
        <div className="px-8 pb-4">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header avec badge de limite et bouton ajouter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentMaxBiens !== null && (
                  <Badge 
                    variant={remainingBiens !== null && remainingBiens <= 0 ? 'destructive' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {biensCount} / {currentMaxBiens} biens
                  </Badge>
                )}
                {currentMaxBiens === null && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {biensCount} biens (illimité)
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={() => {
                  if (canCreateBien) {
                    setDialogOpen(true)
                  } else {
                    setUpgradeModalOpen(true)
                  }
                }}
                disabled={false}
                className={
                  canCreateBien
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-400 cursor-pointer hover:bg-slate-600'
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {canCreateBien ? 'Ajouter un bien' : 'Limite atteinte'}
              </Button>
            </div>

            {/* Alerte si proche de la limite */}
            {currentMaxBiens !== null && remainingBiens !== null && remainingBiens > 0 && remainingBiens <= 2 && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-400">Limite presque atteinte</AlertTitle>
                <AlertDescription className="text-slate-300">
                  Il vous reste {remainingBiens} bien{remainingBiens > 1 ? 's' : ''} disponible{remainingBiens > 1 ? 's' : ''} sur votre plan {PLANS[userPlan].name}.{' '}
                  <Button variant="link" className="p-0 h-auto text-amber-400 hover:text-amber-300" asChild>
                    <Link href="/abonnement">Passer à un plan supérieur</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Alerte si limite atteinte */}
            {currentMaxBiens !== null && remainingBiens !== null && remainingBiens <= 0 && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atteinte</AlertTitle>
                <AlertDescription>
                  Vous avez atteint la limite de {currentMaxBiens} bien{currentMaxBiens > 1 ? 's' : ''} de votre plan {PLANS[userPlan].name}.{' '}
                  <Button variant="link" className="p-0 h-auto text-red-300 hover:text-red-200 underline" asChild>
                    <Link href="/abonnement">Passer à un plan supérieur</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      <BienFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
      {currentMaxBiens !== null && (
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlan={PLANS[userPlan].name}
          currentCount={biensCount}
          maxBiens={currentMaxBiens}
        />
      )}
    </>
  )
}
