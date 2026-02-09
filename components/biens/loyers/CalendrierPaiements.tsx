"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"

interface CalendrierPaiementsProps {
  paiements: Array<{ locataire: boolean; apl: boolean }>
  loyerNetLocataire: number
  montantAPL: number
  moisActuel: number
  anneeActuelle: number
  onToggleLocataire: (index: number) => void
  onToggleAPL: (index: number) => void
  onOpenQuittance: (index: number) => void
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export function CalendrierPaiements({
  paiements,
  loyerNetLocataire,
  montantAPL,
  moisActuel,
  anneeActuelle,
  onToggleLocataire,
  onToggleAPL,
  onOpenQuittance,
}: CalendrierPaiementsProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200">Suivi des paiements {anneeActuelle}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
              ✓ Locataire
            </Badge>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/10">
              ✓ APL
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, index) => {
            const estMoisActuel = index === moisActuel
            const paiement = paiements[index]

            return (
              <div
                key={index}
                className={`
                  relative rounded-xl p-4 transition-all duration-300
                  ${estMoisActuel 
                    ? "ring-2 ring-amber-500 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-600/5" 
                    : "border border-slate-700 bg-slate-800/50"
                  }
                `}
              >
                {/* Mois + pastille actuel */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-slate-300">
                    {MOIS[index]}
                  </h4>
                  {estMoisActuel && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>

                {/* Bouton Locataire */}
                <button
                  onClick={() => onToggleLocataire(index)}
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    ${paiement?.locataire
                      ? "border border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    }
                  `}
                >
                  {paiement?.locataire ? "✓" : "✗"} Locataire
                  <div className="text-xs mt-1 opacity-80">
                    {formatCurrency(loyerNetLocataire)}
                  </div>
                </button>

                {/* Bouton Quittance (si payé) */}
                {paiement?.locataire && (
                  <button
                    onClick={() => onOpenQuittance(index)}
                    className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-all duration-300 shadow-lg shadow-amber-500/20"
                  >
                    📄 Quittance
                  </button>
                )}

                {/* Bouton APL (conditionnel) */}
                {montantAPL > 0 && (
                  <button
                    onClick={() => onToggleAPL(index)}
                    className={`
                      w-full mt-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                      ${paiement?.apl
                        ? "border border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                        : "border border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                      }
                    `}
                  >
                    {paiement?.apl ? "✓" : "✗"} APL
                    <div className="text-xs mt-1 opacity-80">
                      {formatCurrency(montantAPL)}
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Encart astuce */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-200">
            💡 <strong>Astuce :</strong> Cliquez sur &quot;Locataire&quot; ou &quot;APL&quot; pour marquer chaque paiement indépendamment. 
            Le CA annuel se calcule automatiquement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
