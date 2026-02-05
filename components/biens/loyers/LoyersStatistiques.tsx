"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/calculations"

interface LoyersStatistiquesProps {
  moisLocatairePayes: number
  moisAPLPayes: number
  montantAPL: number
  caPrevuTotal: number
  caTotal: number
}

export function LoyersStatistiques({
  moisLocatairePayes,
  moisAPLPayes,
  montantAPL,
  caPrevuTotal,
  caTotal,
}: LoyersStatistiquesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques détaillées</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Paiements Locataire</span>
              <span className="text-sm font-medium">{moisLocatairePayes}/12 mois</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(moisLocatairePayes / 12) * 100}%` }}
              />
            </div>
          </div>
          
          {montantAPL > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Paiements APL</span>
                <span className="text-sm font-medium">{moisAPLPayes}/12 mois</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(moisAPLPayes / 12) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reste à percevoir</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(caPrevuTotal - caTotal)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
