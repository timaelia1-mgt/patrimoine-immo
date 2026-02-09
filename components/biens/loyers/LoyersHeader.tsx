"use client"

import { memo } from "react"
import { DollarSign, Users, Landmark, Wallet } from "lucide-react"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency } from "@/lib/calculations"

interface LoyersHeaderProps {
  caTotal: number          // CA locataire + CA APL (revenus encaissés)
  caPrevuTotal: number     // loyerMensuel × 12 (objectif annuel)
  caLocataire: number      // loyerNetLocataire × moisLocatairePayes
  loyerNetLocataire: number // loyerMensuel - montantAPL
  moisLocatairePayes: number // nb de mois marqués "payé" locataire
  caAPL: number            // montantAPL × moisAPLPayes
  montantAPL: number       // montant APL mensuel (du locataire)
  moisAPLPayes: number     // nb de mois marqués "payé" APL
  loyerMensuel: number     // loyer mensuel du bien
}

export const LoyersHeader = memo(function LoyersHeader({
  caTotal,
  caPrevuTotal,
  caLocataire,
  loyerNetLocataire,
  moisLocatairePayes,
  caAPL,
  montantAPL,
  moisAPLPayes,
  loyerMensuel,
}: LoyersHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* CA Total annuel */}
      <KPICard
        icon={DollarSign}
        label="CA total annuel"
        value={formatCurrency(caTotal)}
        subtext={`sur ${formatCurrency(caPrevuTotal)} prévus`}
        variant="amber"
        delay={0}
      />

      {/* CA Locataire */}
      <KPICard
        icon={Users}
        label="CA Locataire"
        value={formatCurrency(caLocataire)}
        subtext={`${moisLocatairePayes} mois × ${formatCurrency(loyerNetLocataire)}`}
        variant="emerald"
        delay={100}
      />

      {/* CA APL (conditionnel) */}
      {montantAPL > 0 && (
        <KPICard
          icon={Landmark}
          label="CA APL"
          value={formatCurrency(caAPL)}
          subtext={`${moisAPLPayes} mois × ${formatCurrency(montantAPL)}`}
          variant="purple"
          delay={200}
        />
      )}

      {/* Loyer mensuel */}
      <KPICard
        icon={Wallet}
        label="Loyer mensuel"
        value={formatCurrency(loyerMensuel)}
        subtext={montantAPL > 0 ? `${formatCurrency(loyerNetLocataire)} + ${formatCurrency(montantAPL)} APL` : undefined}
        variant="sky"
        delay={montantAPL > 0 ? 300 : 200}
      />
    </div>
  )
})
