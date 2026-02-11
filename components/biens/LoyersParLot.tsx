"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getLots } from "@/lib/database"
import { Loyers } from "./Loyers"

interface LoyersParLotProps {
  bien: any
}

export function LoyersParLot({ bien }: LoyersParLotProps) {
  const [lots, setLots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("")

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true)
        const lotsData = await getLots(bien.id)
        setLots(lotsData)

        // Pré-sélectionner le premier lot
        if (lotsData.length > 0) {
          setActiveTab(lotsData[0].id)
        }
      } catch (error) {
        console.error("Erreur chargement lots:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLots()
  }, [bien.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Aucun lot configuré</p>
      </div>
    )
  }

  // Si 1 seul lot : afficher directement sans sous-onglets
  if (lots.length === 1) {
    return <Loyers bien={bien} lotId={lots[0].id} />
  }

  // Si plusieurs lots : afficher les sous-onglets
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          {lots.map((lot) => (
            <TabsTrigger
              key={lot.id}
              value={lot.id}
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              {lot.numeroLot}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.id} value={lot.id}>
            <Loyers bien={bien} lotId={lot.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
