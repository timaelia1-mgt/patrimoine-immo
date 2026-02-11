"use client"

import { useState, useEffect } from "react"
import { Loader2, Building2 } from "lucide-react"
import { getLots } from "@/lib/database"
import { formatCurrency } from "@/lib/calculations"
import { Loyers } from "./Loyers"

interface LoyersParLotProps {
  bien: any
}

const COULEURS_LOTS = [
  { bg: "from-amber-600/20 to-amber-800/20", border: "border-amber-500/30", text: "text-amber-400", shadow: "shadow-amber-500/10" },
  { bg: "from-sky-600/20 to-sky-800/20", border: "border-sky-500/30", text: "text-sky-400", shadow: "shadow-sky-500/10" },
  { bg: "from-emerald-600/20 to-emerald-800/20", border: "border-emerald-500/30", text: "text-emerald-400", shadow: "shadow-emerald-500/10" },
  { bg: "from-purple-600/20 to-purple-800/20", border: "border-purple-500/30", text: "text-purple-400", shadow: "shadow-purple-500/10" },
  { bg: "from-orange-600/20 to-orange-800/20", border: "border-orange-500/30", text: "text-orange-400", shadow: "shadow-orange-500/10" },
]

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

  // Si plusieurs lots : afficher les cards cliquables + contenu
  return (
    <div className="space-y-6">
      {/* Cards de sélection de lot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lots.map((lot, index) => {
          const isActive = activeTab === lot.id
          const couleur = COULEURS_LOTS[index % COULEURS_LOTS.length]

          return (
            <button
              key={lot.id}
              onClick={() => setActiveTab(lot.id)}
              className={`
                p-4 rounded-xl transition-all duration-200 text-left
                bg-gradient-to-br ${couleur.bg}
                border-2 ${isActive ? couleur.border : "border-slate-700/50"}
                hover:scale-[1.03] hover:shadow-xl
                ${isActive ? `shadow-lg ${couleur.shadow}` : ""}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-5 h-5 ${couleur.text}`} />
                  <span className="font-bold text-slate-200">{lot.numeroLot}</span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400">Loyer mensuel</p>
                <p className={`text-xl font-bold ${couleur.text}`}>
                  {formatCurrency(parseFloat(lot.loyerMensuel?.toString() || "0"))}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Contenu du lot sélectionné */}
      {activeTab && (
        <div className="animate-in fade-in duration-300">
          <Loyers bien={bien} lotId={activeTab} />
        </div>
      )}
    </div>
  )
}
