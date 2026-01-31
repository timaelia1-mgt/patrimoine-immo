"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BienFormDialog } from "@/components/biens/BienFormDialog"

interface DashboardClientProps {
  biens: any[]
  stats: any
}

export function DashboardClient({ biens, stats }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Vérifier si on doit ouvrir le dialog depuis l'URL
  useEffect(() => {
    try {
      const addParam = searchParams?.get("add")
      if (addParam === "true") {
        setDialogOpen(true)
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
          setDialogOpen(true)
          setTimeout(() => {
            const url = new URL(window.location.href)
            url.searchParams.delete("add")
            window.history.replaceState({}, "", url.pathname + url.search)
          }, 100)
        }
      }
    }
  }, [searchParams])

  const handleSuccess = () => {
    setDialogOpen(false)
    // Rechargement complet pour éviter les boucles
    window.location.reload()
  }

  return (
    <BienFormDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onSuccess={handleSuccess}
    />
  )
}
