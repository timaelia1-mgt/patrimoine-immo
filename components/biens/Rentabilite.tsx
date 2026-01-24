"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/calculations"

interface RentabiliteProps {
  bien: any
}

export function Rentabilite({ bien }: RentabiliteProps) {
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  const totalCharges = 
    parseFloat(bien.taxeFonciere?.toString() || "0") +
    parseFloat(bien.chargesCopro?.toString() || "0") +
    parseFloat(bien.assurance?.toString() || "0") +
    parseFloat(bien.fraisGestion?.toString() || "0") +
    parseFloat(bien.autresCharges?.toString() || "0")
  
  const mensualiteCredit = bien.typeFinancement === "CREDIT" 
    ? parseFloat(bien.mensualiteCredit?.toString() || "0")
    : 0
  
  const cashFlowMensuel = loyerMensuel - totalCharges - mensualiteCredit

  // Calcul des revenus et charges cumulés (simulés sur 12 mois)
  const moisPossession = 12 // À améliorer avec les vraies dates
  const revenusCumules = loyerMensuel * moisPossession
  const chargesCumulees = (totalCharges + mensualiteCredit) * moisPossession
  const bilanNet = revenusCumules - chargesCumulees

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenus cumulés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {formatCurrency(revenusCumules)}
          </p>
          <p className="text-sm text-muted-foreground">
            Sur {moisPossession} mois • {formatCurrency(loyerMensuel)}/mois en moyenne
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charges cumulées</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600 mb-2">
            {formatCurrency(chargesCumulees)}
          </p>
          <p className="text-sm text-muted-foreground">
            Dont mensualités : {formatCurrency(mensualiteCredit * moisPossession)}
          </p>
          <p className="text-sm text-muted-foreground">
            Dont charges : {formatCurrency(totalCharges * moisPossession)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bilan net</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold mb-2 ${
            bilanNet > 0 ? "text-green-600" : "text-red-600"
          }`}>
            {bilanNet > 0 ? "+" : ""}{formatCurrency(bilanNet)}
          </p>
          <p className="text-sm text-muted-foreground">
            {bilanNet > 0 ? "Bénéfice" : "Déficit"} cumulé sur {moisPossession} mois
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
