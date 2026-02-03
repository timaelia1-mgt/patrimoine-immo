"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BienFormDialog } from "@/components/biens/BienFormDialog"
import { UpgradeModal } from "@/components/modals/UpgradeModal"
import { getUserProfile, getBiens } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"
import { PLANS } from "@/lib/stripe"

interface DashboardClientProps {
  biens: any[]
  stats: any
}

export function DashboardClient({ biens, stats }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<'decouverte' | 'essentiel' | 'premium'>('decouverte')
  const [biensCount, setBiensCount] = useState(0)
  const [maxBiens, setMaxBiens] = useState<number | null>(null)

  // Vérifier la limite de biens
  useEffect(() => {
    const checkLimit = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      try {
        const profile = await getUserProfile(user.id)
        
        const plan = (profile?.plan || 'decouverte') as 'decouverte' | 'essentiel' | 'premium'
        const count = biens.length // Utiliser les biens passés en props
        const max = PLANS[plan].maxBiens
        
        setUserPlan(plan)
        setBiensCount(count)
        setMaxBiens(max)
      } catch (error) {
        console.error('Erreur lors de la vérification de la limite:', error)
      }
    }
    
    checkLimit()
  }, [biens.length]) // Re-vérifier quand le nombre de biens change

  // Vérifier si on peut créer un bien
  const canCreateBien = maxBiens === null || biensCount < maxBiens

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
      <BienFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
      {maxBiens !== null && (
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlan={PLANS[userPlan].name}
          currentCount={biensCount}
          maxBiens={maxBiens}
        />
      )}
    </>
  )
}
