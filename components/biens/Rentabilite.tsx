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

  // Calculer la durée réelle de possession
  const calculerDureePossession = () => {
    if (!bien.dateAcquisition) return 0
    
    const dateAcquisition = new Date(bien.dateAcquisition)
    const dateDebut = bien.dateMiseEnLocation 
      ? new Date(bien.dateMiseEnLocation) 
      : dateAcquisition
    const maintenant = new Date()
    
    const diffMs = maintenant.getTime() - dateDebut.getTime()
    const moisPossession = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
    
    return Math.max(0, moisPossession)
  }

  const moisPossession = calculerDureePossession()
  const revenusCumules = (bien.revenusAnterieursOverride ?? null) !== null
    ? bien.revenusAnterieursOverride!
    : loyerMensuel * moisPossession

  const chargesCumulees = (bien.chargesAnterieuresOverride ?? null) !== null
    ? bien.chargesAnterieuresOverride!
    : (totalCharges + mensualiteCredit) * moisPossession

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
