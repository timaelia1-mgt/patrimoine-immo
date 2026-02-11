"use client"

import { useMemo, useEffect, useState } from "react"
import { Wallet, TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, Building2, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency, calculateChargesMensuelles, calculerCashFlow, calculerLoyerNet } from "@/lib/calculations"
import { getLots, getLocataires } from "@/lib/database"
import type { Bien } from "@/lib/database"

interface VueEnsembleProps {
  bien: Bien
}

export function VueEnsemble({ bien }: VueEnsembleProps) {
  const [lots, setLots] = useState<any[]>([])
  const [locataires, setLocataires] = useState<any[]>([])

  // Charger lots et locataires
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lotsData, locatairesData] = await Promise.all([
          getLots(bien.id),
          getLocataires(bien.id)
        ])
        setLots(lotsData)
        setLocataires(locatairesData)
      } catch (error) {
        console.error("Erreur chargement lots/locataires:", error)
      }
    }
    fetchData()
  }, [bien.id])

  // Calculs globaux existants
  const cashFlow = useMemo(() => calculerCashFlow(bien), [bien])
  const loyerNet = useMemo(() => calculerLoyerNet(bien), [bien])
  const mensualiteCredit = useMemo(() => {
    if (bien.typeFinancement === "CASH") return 0
    return parseFloat(bien.mensualiteCredit?.toString() || "0") || 0
  }, [bien])
  const cashFlowVariant = useMemo(() => {
    if (cashFlow > 0) return "emerald"
    if (cashFlow < 0) return "red"
    return "orange"
  }, [cashFlow])

  // Fonction de calcul par lot
  const calculerInfosLot = (lot: any) => {
    const locatairesDuLot = locataires.filter(loc => loc.lotId === lot.id)
    const loyerLot = parseFloat(lot.loyerMensuel?.toString() || "0")
    const totalAPLLot = locatairesDuLot.reduce(
      (sum: number, loc: any) => sum + parseFloat(loc.montantAPL || "0"),
      0
    )
    const resteACharge = loyerLot - totalAPLLot

    // Charges proportionnelles au lot
    const loyerTotalBien = parseFloat(bien.loyerMensuel?.toString() || "0")
    const ratioLot = loyerTotalBien > 0 ? loyerLot / loyerTotalBien : 0

    const chargesLot = {
      taxeFonciere: parseFloat(bien.taxeFonciere?.toString() || "0") * ratioLot,
      chargesCopro: parseFloat(bien.chargesCopro?.toString() || "0") * ratioLot,
      assurance: parseFloat(bien.assurance?.toString() || "0") * ratioLot,
      fraisGestion: parseFloat(bien.fraisGestion?.toString() || "0") * ratioLot,
      autresCharges: parseFloat(bien.autresCharges?.toString() || "0") * ratioLot,
    }

    const totalChargesLot = Object.values(chargesLot).reduce((a, b) => a + b, 0)

    let mensualiteCreditLot = 0
    if (bien.typeFinancement === "CREDIT" && bien.mensualiteCredit) {
      mensualiteCreditLot = parseFloat(bien.mensualiteCredit.toString()) * ratioLot
    }

    const cashFlowLot = loyerLot - totalChargesLot - mensualiteCreditLot

    return {
      locataires: locatairesDuLot,
      loyerLot,
      totalAPLLot,
      resteACharge,
      chargesLot,
      totalChargesLot,
      mensualiteCreditLot,
      cashFlowLot,
    }
  }

  return (
    <div className="space-y-6">
      {/* Section KPIs financiers globaux */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-500" />
          Vue financière mensuelle
        </h3>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${mensualiteCredit > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          <KPICard
            icon={Wallet}
            label="Loyer mensuel"
            value={formatCurrency(bien.loyerMensuel || 0)}
            subtext="Loyer brut perçu"
            variant="amber"
            delay={0}
          />
          <KPICard
            icon={PiggyBank}
            label="Loyer net"
            value={formatCurrency(loyerNet)}
            subtext="Après charges, avant crédit"
            variant="purple"
            delay={100}
          />
          {mensualiteCredit > 0 && (
            <KPICard
              icon={CreditCard}
              label="Mensualité crédit"
              value={formatCurrency(mensualiteCredit)}
              subtext="Remboursement mensuel"
              variant="red"
              delay={150}
            />
          )}
          <KPICard
            icon={TrendingUp}
            label="Cash-flow"
            value={formatCurrency(cashFlow)}
            subtext={mensualiteCredit > 0 ? "Après charges et crédit" : "Après charges"}
            badge={cashFlow > 0 ? "+✓" : cashFlow < 0 ? "−✗" : "="}
            variant={cashFlowVariant}
            delay={200}
          />
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

      {/* Note cash-flow négatif */}
      {cashFlow < 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in duration-500">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Cash-flow négatif</h4>
              <p className="text-sm text-red-300/80">
                {mensualiteCredit > 0
                  ? `Vos charges (${formatCurrency(calculateChargesMensuelles(bien))}) + crédit (${formatCurrency(mensualiteCredit)}) dépassent votre loyer (${formatCurrency(bien.loyerMensuel || 0)}). Effort d'épargne : ${formatCurrency(Math.abs(cashFlow))}/mois.`
                  : `Vos charges mensuelles (${formatCurrency(calculateChargesMensuelles(bien))}) dépassent votre loyer (${formatCurrency(bien.loyerMensuel || 0)}). Vous devez compléter de votre poche chaque mois.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note cash-flow positif */}
      {cashFlow > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in duration-500 delay-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400 mb-1">Cash-flow positif</h4>
              <p className="text-sm text-emerald-300/80">
                Votre bien génère un revenu net de {formatCurrency(cashFlow)} par mois après déduction de toutes les charges{mensualiteCredit > 0 ? " et du crédit" : ""}.
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
                Renseignez le loyer mensuel dans l&apos;onglet <strong>Loyers</strong> pour voir vos statistiques financières.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* === VUE PAR LOT === */}
      {lots.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Détail par lot
          </h3>

          {lots.map((lot) => {
            const infos = calculerInfosLot(lot)

            return (
              <Card
                key={lot.id}
                className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
              >
                <CardHeader className="border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-slate-200 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      {lot.numeroLot}
                    </CardTitle>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/50">
                      {formatCurrency(infos.loyerLot)} / mois
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Locataire(s) du lot */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Locataire{infos.locataires.length > 1 ? "s" : ""}
                    </h4>
                    {infos.locataires.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Aucun locataire</p>
                    ) : (
                      <div className="space-y-2">
                        {infos.locataires.map((loc: any) => (
                          <div
                            key={loc.id}
                            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-slate-200 font-medium">
                                {loc.prenom} {loc.nom}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/50">
                                  APL: {formatCurrency(parseFloat(loc.montantAPL || "0"))}
                                </Badge>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/50">
                                  Reste: {formatCurrency(infos.loyerLot - parseFloat(loc.montantAPL || "0"))}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* KPIs du lot */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                      icon={Wallet}
                      label="Loyer mensuel"
                      value={formatCurrency(infos.loyerLot)}
                      subtext={`dont APL ${formatCurrency(infos.totalAPLLot)}`}
                      variant="amber"
                      delay={0}
                    />
                    <KPICard
                      icon={TrendingDown}
                      label="Charges mensuelles"
                      value={formatCurrency(infos.totalChargesLot)}
                      subtext="Prorata du lot"
                      variant="red"
                      delay={100}
                    />
                    <KPICard
                      icon={TrendingUp}
                      label="Cash-flow mensuel"
                      value={formatCurrency(infos.cashFlowLot)}
                      subtext={infos.cashFlowLot >= 0 ? "Positif" : "Négatif"}
                      variant={infos.cashFlowLot >= 0 ? "emerald" : "red"}
                      delay={200}
                    />
                  </div>

                  {/* Détail charges */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-3">
                      Détail des charges (prorata)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="text-slate-400">
                        Taxe foncière: <span className="text-slate-200">{formatCurrency(infos.chargesLot.taxeFonciere)}</span>
                      </div>
                      <div className="text-slate-400">
                        Copropriété: <span className="text-slate-200">{formatCurrency(infos.chargesLot.chargesCopro)}</span>
                      </div>
                      <div className="text-slate-400">
                        Assurance: <span className="text-slate-200">{formatCurrency(infos.chargesLot.assurance)}</span>
                      </div>
                      <div className="text-slate-400">
                        Frais gestion: <span className="text-slate-200">{formatCurrency(infos.chargesLot.fraisGestion)}</span>
                      </div>
                      {infos.chargesLot.autresCharges > 0 && (
                        <div className="text-slate-400">
                          Autres: <span className="text-slate-200">{formatCurrency(infos.chargesLot.autresCharges)}</span>
                        </div>
                      )}
                      {infos.mensualiteCreditLot > 0 && (
                        <div className="text-slate-400">
                          Crédit: <span className="text-slate-200">{formatCurrency(infos.mensualiteCreditLot)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Total global si plusieurs lots */}
      {lots.length > 1 && (
        <Card className="border-0 bg-gradient-to-br from-amber-900/20 to-slate-900/90 backdrop-blur-xl shadow-2xl border border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-slate-200">Total du bien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">Loyer total</p>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(lots.reduce((sum, lot) => sum + parseFloat(lot.loyerMensuel?.toString() || "0"), 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Charges totales</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(
                    lots.reduce((sum, lot) => {
                      const infos = calculerInfosLot(lot)
                      return sum + infos.totalChargesLot
                    }, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Cash-flow total</p>
                <p className={`text-2xl font-bold ${
                  lots.reduce((sum, lot) => sum + calculerInfosLot(lot).cashFlowLot, 0) >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {formatCurrency(
                    lots.reduce((sum, lot) => {
                      const infos = calculerInfosLot(lot)
                      return sum + infos.cashFlowLot
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
