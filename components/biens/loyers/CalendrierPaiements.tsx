"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { User } from "lucide-react"

interface PaiementData {
  mois: number
  locataire: boolean
  apl: boolean
  locataireId?: string | null
}

interface LocataireInfo {
  id: string
  nom: string
  prenom: string
  montantAPL: number
}

interface CalendrierPaiementsProps {
  paiements: PaiementData[]
  locataires: LocataireInfo[]
  loyerMensuel: number
  moisActuel: number
  anneeActuelle: number
  onTogglePaiement: (mois: number, type: "locataire" | "apl", locataireId: string) => void
  onOpenQuittance: (mois: number, locataireId: string) => void
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

const COULEURS_LOCATAIRES = [
  { badge: "bg-amber-500/10 text-amber-400 border-amber-500/50", btn: "border-amber-500", btnBg: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
  { badge: "bg-sky-500/10 text-sky-400 border-sky-500/50", btn: "border-sky-500", btnBg: "bg-sky-500/10 text-sky-400 hover:bg-sky-500/20" },
  { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/50", btn: "border-emerald-500", btnBg: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
  { badge: "bg-purple-500/10 text-purple-400 border-purple-500/50", btn: "border-purple-500", btnBg: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" },
  { badge: "bg-orange-500/10 text-orange-400 border-orange-500/50", btn: "border-orange-500", btnBg: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
  { badge: "bg-pink-500/10 text-pink-400 border-pink-500/50", btn: "border-pink-500", btnBg: "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20" },
]

export function CalendrierPaiements({
  paiements,
  locataires,
  loyerMensuel,
  moisActuel,
  anneeActuelle,
  onTogglePaiement,
  onOpenQuittance,
}: CalendrierPaiementsProps) {

  const getPaiement = (mois: number, locataireId: string): PaiementData | undefined => {
    return paiements.find(p => p.mois === mois && p.locataireId === locataireId)
  }

  // Aucun locataire configuré
  if (locataires.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardContent className="py-12">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Aucun locataire configuré</p>
            <p className="text-sm text-slate-500 mt-1">
              Ajoutez un locataire dans l&apos;onglet &quot;Locataires&quot; pour suivre les paiements.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200">Suivi des paiements {anneeActuelle}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {locataires.map((loc, idx) => {
              const couleur = COULEURS_LOCATAIRES[idx % COULEURS_LOCATAIRES.length]
              return (
                <Badge key={loc.id} variant="outline" className={couleur.badge}>
                  {loc.prenom} {loc.nom}
                </Badge>
              )
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, moisIndex) => {
            const estMoisActuel = moisIndex === moisActuel

            return (
              <div
                key={moisIndex}
                className={`
                  relative rounded-xl p-4 transition-all duration-300
                  ${estMoisActuel 
                    ? "ring-2 ring-amber-500 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-600/5" 
                    : "border border-slate-700 bg-slate-800/50"
                  }
                `}
              >
                {/* Header du mois */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-slate-300">
                    {MOIS[moisIndex]}
                  </h4>
                  {estMoisActuel && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>

                {/* Une ligne PAR locataire */}
                <div className="space-y-2">
                  {locataires.map((locataire, locIdx) => {
                    const paiement = getPaiement(moisIndex, locataire.id)
                    const montantAPL = parseFloat(locataire.montantAPL?.toString() || "0")
                    const resteACharge = loyerMensuel - montantAPL
                    const couleur = COULEURS_LOCATAIRES[locIdx % COULEURS_LOCATAIRES.length]

                    return (
                      <div key={locataire.id} className="space-y-1">
                        {/* Badge locataire (seulement si multi-locataires) */}
                        {locataires.length > 1 && (
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">
                              {locataire.prenom} {locataire.nom}
                            </span>
                          </div>
                        )}

                        {/* Bouton Locataire */}
                        <button
                          onClick={() => onTogglePaiement(moisIndex, "locataire", locataire.id)}
                          className={`
                            w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                            ${paiement?.locataire
                              ? `border ${couleur.btn} bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`
                              : "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            }
                          `}
                        >
                          {paiement?.locataire ? "✓" : "✗"} Locataire
                          <div className="text-xs mt-1 opacity-80">
                            {formatCurrency(resteACharge)}
                          </div>
                        </button>

                        {/* Bouton Quittance (si payé) */}
                        {paiement?.locataire && (
                          <button
                            onClick={() => onOpenQuittance(moisIndex, locataire.id)}
                            className="w-full px-2 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-all duration-300 shadow-lg shadow-amber-500/20"
                          >
                            📄 Quittance
                          </button>
                        )}

                        {/* Bouton APL (conditionnel) */}
                        {montantAPL > 0 && (
                          <button
                            onClick={() => onTogglePaiement(moisIndex, "apl", locataire.id)}
                            className={`
                              w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
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

                        {/* Séparateur entre locataires */}
                        {locataires.length > 1 && locIdx < locataires.length - 1 && (
                          <div className="border-b border-slate-700/50 my-2" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Encart astuce */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-200">
            💡 <strong>Astuce :</strong> Cliquez sur &quot;Locataire&quot; ou &quot;APL&quot; pour marquer chaque paiement indépendamment.
            {locataires.length > 1 && " Chaque locataire a ses propres paiements et quittances."}
            {" "}Le CA annuel se calcule automatiquement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
