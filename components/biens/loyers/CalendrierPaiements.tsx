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

const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Suivi des paiements {anneeActuelle}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-700">
              Locataire
            </Badge>
            {montantAPL > 0 && (
              <Badge variant="outline" className="border-purple-500 text-purple-700">
                APL
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {moisNoms.map((mois, index) => {
            const paiement = paiements[index]
            const isMoisActuel = index === moisActuel
            const isFutur = index > moisActuel
            
            return (
              <div
                key={index}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isMoisActuel ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                  ${isFutur ? 'opacity-50' : ''}
                `}
              >
                {isMoisActuel && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-20">
                    <span className="text-white text-xs font-bold">•</span>
                  </div>
                )}
                
                <div className="text-center mb-3">
                  <p className="font-semibold text-lg mb-1">{mois}</p>
                  <p className="text-xs text-muted-foreground">
                    {isFutur ? 'À venir' : anneeActuelle.toString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {/* Bouton Locataire */}
                  <div className="relative">
                    <button
                      onClick={() => !isFutur && onToggleLocataire(index)}
                      disabled={isFutur}
                      className={`
                        w-full p-2 rounded border-2 text-sm font-medium transition-all
                        ${paiement.locataire
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        }
                        ${isFutur ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                      `}
                    >
                      {paiement.locataire ? '✓' : '✗'} Locataire
                      <div className="text-xs mt-1 font-semibold">
                        {formatCurrency(loyerNetLocataire)}
                      </div>
                    </button>
                    
                    {/* Bouton Quittance */}
                    {paiement.locataire && !isFutur && (
                      <button
                        onClick={() => onOpenQuittance(index)}
                        className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2 py-1 rounded shadow-lg transition-colors z-10"
                        title="Générer quittance"
                      >
                        📄 Quittance
                      </button>
                    )}
                  </div>
                  
                  {/* Bouton APL */}
                  {montantAPL > 0 && (
                    <button
                      onClick={() => !isFutur && onToggleAPL(index)}
                      disabled={isFutur}
                      className={`
                        w-full p-2 rounded border-2 text-sm font-medium transition-all
                        ${paiement.apl
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-orange-500 bg-orange-50 text-orange-700'
                        }
                        ${isFutur ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                      `}
                    >
                      {paiement.apl ? '✓' : '✗'} APL
                      <div className="text-xs mt-1 font-semibold">
                        {formatCurrency(montantAPL)}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            💡 <strong>Astuce :</strong> Cliquez sur "Locataire" ou "APL" pour marquer chaque paiement indépendamment. 
            Le CA annuel se calcule automatiquement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
