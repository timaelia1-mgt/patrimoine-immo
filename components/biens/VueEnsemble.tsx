"use client"

import { useMemo } from "react"
import { Wallet, TrendingUp, DollarSign, PiggyBank } from "lucide-react"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency, calculateChargesMensuelles } from "@/lib/calculations"
import type { Bien } from "@/lib/database"

interface VueEnsembleProps {
  bien: Bien
}

export function VueEnsemble({ bien }: VueEnsembleProps) {
  // Calcul du cash-flow (loyer - charges)
  const cashFlow = useMemo(() => {
    const loyer = bien.loyerMensuel || 0
    const charges = calculateChargesMensuelles(bien)
    return loyer - charges
  }, [bien])

  // Calcul du loyer net (après charges mais pas de crédit)
  const loyerNet = useMemo(() => {
    const loyer = bien.loyerMensuel || 0
    const charges = calculateChargesMensuelles(bien)
    return loyer - charges
  }, [bien])

  // Déterminer la variante du cash-flow
  const cashFlowVariant = useMemo(() => {
    if (cashFlow > 0) return "emerald"
    if (cashFlow < 0) return "red"
    return "orange"
  }, [cashFlow])

  return (
    <div className="space-y-6">
      {/* Section KPIs financiers */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-500" />
          Vue financière mensuelle
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Loyer mensuel */}
          <KPICard
            icon={Wallet}
            label="Loyer mensuel"
            value={formatCurrency(bien.loyerMensuel || 0)}
            subtext="Charges comprises"
            variant="amber"
            delay={0}
          />

          {/* Loyer net (après charges) */}
          <KPICard
            icon={PiggyBank}
            label="Loyer net"
            value={formatCurrency(loyerNet)}
            subtext="Après charges"
            variant="purple"
            delay={100}
          />

          {/* Cash-flow */}
          <KPICard
            icon={TrendingUp}
            label="Cash-flow"
            value={formatCurrency(cashFlow)}
            subtext={cashFlow >= 0 ? "Positif" : "Négatif"}
            badge={cashFlow > 0 ? "+✓" : cashFlow < 0 ? "−✗" : "="}
            variant={cashFlowVariant}
            delay={200}
          />

          {/* Charges mensuelles */}
          <KPICard
            icon={Wallet}
            label="Charges totales"
            value={formatCurrency(calculateChargesMensuelles(bien))}
            subtext="Par mois"
            variant="slate"
            delay={300}
          />
        </div>
      </div>

      {/* Note explicative si cash-flow négatif */}
      {cashFlow < 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in duration-500">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Cash-flow négatif</h4>
              <p className="text-sm text-red-300/80">
                Vos charges mensuelles ({formatCurrency(calculateChargesMensuelles(bien))}) dépassent votre loyer ({formatCurrency(bien.loyerMensuel || 0)}). 
                Vous devez compléter de votre poche chaque mois.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note explicative si cash-flow positif */}
      {cashFlow > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in duration-500 delay-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400 mb-1">Cash-flow positif</h4>
              <p className="text-sm text-emerald-300/80">
                Votre bien génère un revenu net de {formatCurrency(cashFlow)} par mois après déduction de toutes les charges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note si pas de loyer défini */}
      {!bien.loyerMensuel && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 mb-1">Aucun loyer défini</h4>
              <p className="text-sm text-amber-300/80">
                Renseignez le loyer mensuel dans l'onglet <strong>Loyers</strong> pour voir vos statistiques financières.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
