"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { useState, useEffect } from "react"

interface LoyersProps {
  bien: any
}

export function Loyers({ bien }: LoyersProps) {
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  
  // Récupérer les infos locataire depuis localStorage
  const getLocataireInfo = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`locataire-${bien.id}`)
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return null
  }

  const locataireInfo = getLocataireInfo()
  const montantAPL = parseFloat(locataireInfo?.montantAPL || "0")
  const loyerNetLocataire = loyerMensuel - montantAPL
  
  const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  const anneeActuelle = new Date().getFullYear()
  const moisActuel = new Date().getMonth()
  
  // États des paiements : { locataire: boolean, apl: boolean }
  const [paiements, setPaiements] = useState<Array<{ locataire: boolean; apl: boolean }>>(
    Array.from({ length: 12 }, (_, i) => ({
      locataire: i < moisActuel,
      apl: montantAPL > 0 ? i < moisActuel : false
    }))
  )

  // Charger les paiements depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`paiements-${bien.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPaiements(parsed)
        } catch (error) {
          console.error("Erreur lors du chargement des paiements:", error)
        }
      }
    }
  }, [bien.id])

  const togglePaiementLocataire = (index: number) => {
    const newPaiements = [...paiements]
    newPaiements[index] = {
      ...newPaiements[index],
      locataire: !newPaiements[index].locataire
    }
    setPaiements(newPaiements)
    savePaiements(newPaiements)
  }

  const togglePaiementAPL = (index: number) => {
    const newPaiements = [...paiements]
    newPaiements[index] = {
      ...newPaiements[index],
      apl: !newPaiements[index].apl
    }
    setPaiements(newPaiements)
    savePaiements(newPaiements)
  }

  const savePaiements = (nouveauxPaiements: Array<{ locataire: boolean; apl: boolean }>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`paiements-${bien.id}`, JSON.stringify(nouveauxPaiements))
    }
  }

  // Calculs
  const moisLocatairePayes = paiements.filter(p => p.locataire).length
  const moisAPLPayes = paiements.filter(p => p.apl).length
  
  const caLocataire = loyerNetLocataire * moisLocatairePayes
  const caAPL = montantAPL * moisAPLPayes
  const caTotal = caLocataire + caAPL
  
  const caPrevuLocataire = loyerNetLocataire * 12
  const caPrevuAPL = montantAPL * 12
  const caPrevuTotal = loyerMensuel * 12

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">CA total annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(caTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              sur {formatCurrency(caPrevuTotal)} prévus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">CA Locataire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(caLocataire)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {moisLocatairePayes} mois × {formatCurrency(loyerNetLocataire)}
            </p>
          </CardContent>
        </Card>

        {montantAPL > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">CA APL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(caAPL)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {moisAPLPayes} mois × {formatCurrency(montantAPL)}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Loyer mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(loyerMensuel)}
            </p>
            {montantAPL > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(loyerNetLocataire)} + {formatCurrency(montantAPL)} APL
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendrier unifié */}
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
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
                    <button
                      onClick={() => !isFutur && togglePaiementLocataire(index)}
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

                    {/* Bouton APL */}
                    {montantAPL > 0 && (
                      <button
                        onClick={() => !isFutur && togglePaiementAPL(index)}
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

      {/* Statistiques */}
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
    </div>
  )
}
