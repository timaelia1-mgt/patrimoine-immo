"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/calculations"

interface LoyersStatistiquesProps {
  moisLocatairePayes: number
  moisAPLPayes: number
  montantAPL: number
  caPrevuTotal: number
  caTotal: number
}

export const LoyersStatistiques = memo(function LoyersStatistiques({
  moisLocatairePayes,
  moisAPLPayes,
  montantAPL,
  caPrevuTotal,
  caTotal,
}: LoyersStatistiquesProps) {
  const progressionLocataire = (moisLocatairePayes / 12) * 100
  const progressionAPL = montantAPL > 0 ? (moisAPLPayes / 12) * 100 : 0
  const resteAPercevoir = caPrevuTotal - caTotal

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-slate-200">Statistiques détaillées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barre Locataire */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">Paiements Locataire</span>
            <span className="text-sm font-bold text-emerald-400">{moisLocatairePayes}/12 mois</span>
          </div>
          <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/30"
              style={{ width: `${progressionLocataire}%` }}
            />
          </div>
        </div>

        {/* Barre APL (conditionnel) */}
        {montantAPL > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Paiements APL</span>
              <span className="text-sm font-bold text-purple-400">{moisAPLPayes}/12 mois</span>
            </div>
            <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out shadow-lg shadow-purple-500/30"
                style={{ width: `${progressionAPL}%` }}
              />
            </div>
          </div>
        )}

        {/* Reste à percevoir */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-400">Reste à percevoir</span>
            <span className="text-lg font-bold text-amber-400">
              {formatCurrency(resteAPercevoir)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
