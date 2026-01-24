"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/calculations"

interface VueEnsembleProps {
  bien: any
}

export function VueEnsemble({ bien }: VueEnsembleProps) {
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  const taxeFonciere = parseFloat(bien.taxeFonciere?.toString() || "0")
  const chargesCopro = parseFloat(bien.chargesCopro?.toString() || "0")
  const assurance = parseFloat(bien.assurance?.toString() || "0")
  const fraisGestion = parseFloat(bien.fraisGestion?.toString() || "0")
  const autresCharges = parseFloat(bien.autresCharges?.toString() || "0")
  
  const totalCharges = taxeFonciere + chargesCopro + assurance + fraisGestion + autresCharges
  const loyerNet = loyerMensuel - totalCharges
  
  const mensualiteCredit = bien.typeFinancement === "CREDIT" 
    ? parseFloat(bien.mensualiteCredit?.toString() || "0")
    : 0
  
  const cashFlow = loyerNet - mensualiteCredit

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Résumé financier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Loyer mensuel</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(loyerMensuel)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Loyer net</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(loyerNet)}
              </p>
              <p className="text-xs text-muted-foreground">après charges</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cash-flow</p>
              <p className={`text-2xl font-bold ${
                cashFlow > 0 ? "text-green-600" :
                cashFlow < 0 ? "text-red-600" : "text-yellow-600"
              }`}>
                {cashFlow > 0 ? "+" : ""}{formatCurrency(cashFlow)}
              </p>
              <p className="text-xs text-muted-foreground">après tout</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Statut</p>
              <p className="text-lg font-medium">
                {bien.typeFinancement === "CASH" ? "Autofinancé (Cash)" :
                 cashFlow >= 0 ? `Autofinancé (${Math.round((loyerNet / mensualiteCredit) * 100)}%)` :
                 "Non autofinancé"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom du bien</p>
              <p className="font-medium">{bien.nom}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{bien.adresse}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ville</p>
              <p className="font-medium">{bien.ville}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Code postal</p>
              <p className="font-medium">{bien.codePostal}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Type de financement</p>
            <p className="font-medium">
              {bien.typeFinancement === "CASH" ? "Payé comptant" : "Crédit"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}