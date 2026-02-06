"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, calculateChargesMensuelles, calculateTRIBien } from "@/lib/calculations"
import { CashFlowChart } from './rentabilite/CashFlowChart'
import { ChargesBreakdown } from './rentabilite/ChargesBreakdown'

interface RentabiliteProps {
  bien: any
}

export function Rentabilite({ bien }: RentabiliteProps) {
  // Tous les calculs mémorisés - ne se refont QUE si `bien` change
  const calculatedValues = useMemo(() => {
    // Calculs de base
    const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
    const totalCharges = calculateChargesMensuelles(bien)
    const mensualiteCredit = bien.typeFinancement === "CREDIT" 
      ? parseFloat(bien.mensualiteCredit?.toString() || "0")
      : 0
    const cashFlowMensuel = loyerMensuel - totalCharges - mensualiteCredit

    // Calcul durée de possession
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

    // Revenus et charges cumulés
    const revenusCumules = (bien.revenusAnterieursOverride ?? null) !== null
      ? bien.revenusAnterieursOverride!
      : loyerMensuel * moisPossession
    const chargesCumulees = (bien.chargesAnterieuresOverride ?? null) !== null
      ? bien.chargesAnterieuresOverride!
      : (totalCharges + mensualiteCredit) * moisPossession
    const bilanNet = revenusCumules - chargesCumulees

    // Calculs d'investissement
    const prixAchat = parseFloat(bien.prixAchat?.toString() || "0")
    const fraisNotaire = parseFloat(bien.fraisNotaire?.toString() || "0")
    const travauxInitiaux = parseFloat(bien.travauxInitiaux?.toString() || "0")
    const autresFrais = parseFloat(bien.autresFrais?.toString() || "0")
    const investissementTotal = prixAchat + fraisNotaire + travauxInitiaux + autresFrais

    // Calculs de rentabilité
    const loyerAnnuel = loyerMensuel * 12
    const rentabiliteBrute = prixAchat > 0 ? (loyerAnnuel / prixAchat) * 100 : 0
    const chargesAnnuelles = totalCharges * 12
    const loyerNetAnnuel = loyerAnnuel - chargesAnnuelles
    const rentabiliteNette = investissementTotal > 0 ? (loyerNetAnnuel / investissementTotal) * 100 : 0

    // Cash-flow annuel
    const mensualitesAnnuelles = mensualiteCredit * 12
    const cashFlowAnnuel = loyerNetAnnuel - mensualitesAnnuelles

    // ROI
    const roi = investissementTotal > 0 ? (bilanNet / investissementTotal) * 100 : 0

    // TRI
    const tri = calculateTRIBien(bien, loyerMensuel, totalCharges, mensualiteCredit, moisPossession)

    // Données pour les graphiques
    const chargesBreakdown = {
      taxeFonciere: parseFloat(bien.taxeFonciere?.toString() || "0"),
      chargesCopro: parseFloat(bien.chargesCopro?.toString() || "0"),
      assurance: parseFloat(bien.assurance?.toString() || "0"),
      fraisGestion: parseFloat(bien.fraisGestion?.toString() || "0"),
      autresCharges: parseFloat(bien.autresCharges?.toString() || "0"),
    }

    return {
      loyerMensuel,
      totalCharges,
      mensualiteCredit,
      cashFlowMensuel,
      moisPossession,
      revenusCumules,
      chargesCumulees,
      bilanNet,
      prixAchat,
      investissementTotal,
      loyerAnnuel,
      rentabiliteBrute,
      chargesAnnuelles,
      rentabiliteNette,
      cashFlowAnnuel,
      roi,
      tri,
      chargesBreakdown,
    }
  }, [bien]) // Ne recalcule QUE si bien change

  // Destructuration pour utilisation dans le JSX
  const {
    loyerMensuel,
    totalCharges,
    mensualiteCredit,
    moisPossession,
    revenusCumules,
    chargesCumulees,
    bilanNet,
    prixAchat,
    investissementTotal,
    rentabiliteBrute,
    rentabiliteNette,
    cashFlowAnnuel,
    roi,
    tri,
    chargesBreakdown,
  } = calculatedValues

  return (
    <div className="space-y-6">
      {/* Alerte si données manquantes */}
      {investissementTotal === 0 && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900">
              ⚠️ <strong>Données d&apos;investissement manquantes :</strong> Renseignez l&apos;onglet &quot;Investissement&quot; pour obtenir des calculs de rentabilité précis.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Section 1: Indicateurs de rentabilité */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Rentabilité brute</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {rentabiliteBrute.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Loyer annuel / Prix d&apos;achat
            </p>
            {prixAchat === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Prix d&apos;achat manquant
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Rentabilité nette</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {rentabiliteNette.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Loyer - Charges) annuel / Investissement total
            </p>
            {investissementTotal === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Investissement manquant
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Section 2: Performance financière */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Cash-flow annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              cashFlowAnnuel > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {cashFlowAnnuel > 0 ? "+" : ""}{formatCurrency(cashFlowAnnuel)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Loyer net - Mensualités
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">ROI actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              roi > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {roi > 0 ? "+" : ""}{roi.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bilan net / Investissement total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Investissement total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(investissementTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Achat + frais + travaux
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">TRI</CardTitle>
          </CardHeader>
          <CardContent>
            {tri !== null ? (
              <>
                <p className={`text-2xl font-bold ${
                  tri > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {tri > 0 ? "+" : ""}{tri.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taux de rendement interne
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-400">-</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {moisPossession < 6 
                    ? "Historique insuffisant (min 6 mois)"
                    : investissementTotal === 0
                    ? "Données manquantes"
                    : "Non calculable"
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 2.5: Graphiques d'analyse */}
      <div className="grid grid-cols-2 gap-4">
        <CashFlowChart
          loyerMensuel={loyerMensuel}
          totalCharges={totalCharges}
          mensualiteCredit={mensualiteCredit}
          moisPossession={moisPossession}
        />
        
        <ChargesBreakdown
          taxeFonciere={chargesBreakdown.taxeFonciere}
          chargesCopro={chargesBreakdown.chargesCopro}
          assurance={chargesBreakdown.assurance}
          fraisGestion={chargesBreakdown.fraisGestion}
          autresCharges={chargesBreakdown.autresCharges}
          mensualiteCredit={mensualiteCredit}
        />
      </div>

      {/* Section 3: Revenus et charges cumulés (ancien contenu conservé) */}
      <Card>
        <CardHeader>
          <CardTitle>Bilan cumulé depuis la mise en location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Revenus cumulés</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sur {moisPossession} mois • {formatCurrency(loyerMensuel)}/mois en moyenne
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(revenusCumules)}
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Charges cumulées</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mensualités : {formatCurrency(mensualiteCredit * moisPossession)} • 
                  Charges : {formatCurrency(totalCharges * moisPossession)}
                </p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(chargesCumulees)}
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t-2">
              <div>
                <p className="text-base font-medium">Bilan net cumulé</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bilanNet > 0 ? "Bénéfice" : "Déficit"} sur {moisPossession} mois
                </p>
              </div>
              <p className={`text-3xl font-bold ${
                bilanNet > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {bilanNet > 0 ? "+" : ""}{formatCurrency(bilanNet)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Section 4: Interprétation des indicateurs */}
      <Card className="border-indigo-500 bg-indigo-50 dark:bg-indigo-950">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-indigo-100">
            💡 Interprétation des indicateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-indigo-900 dark:text-indigo-100">
          <div>
            <strong>Rentabilité brute :</strong> Indicateur rapide du potentiel locatif. 
            Une rentabilité &gt; 5% est généralement considérée comme bonne pour l&apos;immobilier locatif.
          </div>
          <div>
            <strong>Rentabilité nette :</strong> Prend en compte les charges réelles. 
            C&apos;est l&apos;indicateur le plus fiable pour comparer différents investissements.
          </div>
          <div>
            <strong>Cash-flow annuel :</strong> Argent qui reste dans votre poche chaque année après toutes les dépenses. 
            Un cash-flow positif signifie que le bien s&apos;autofinance.
          </div>
          <div>
            <strong>ROI :</strong> Retour sur investissement depuis l&apos;achat. 
            Plus il est élevé, plus vite vous rentabilisez votre investissement initial.
          </div>
          <div>
            <strong>TRI (Taux de Rendement Interne) :</strong> Taux d&apos;actualisation qui égalise 
            la valeur actuelle des revenus et de l&apos;investissement initial. 
            Un TRI &gt; 5% est généralement considéré comme excellent pour l&apos;immobilier locatif. 
            Plus le TRI est élevé, plus l&apos;investissement est rentable sur le long terme.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
