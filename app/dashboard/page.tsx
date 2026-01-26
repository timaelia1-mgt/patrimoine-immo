"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  TrendingUp,
  Home,
  DollarSign,
  AlertCircle,
  Wallet,
  PiggyBank,
  CreditCard,
} from "lucide-react"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, biensRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/biens"),
      ])

      const statsData = await statsRes.json()
      const biensData = await biensRes.json()

      setStats(statsData)
      setBiens(biensData)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!stats || biens.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto py-12">
          <h2 className="text-2xl font-bold mb-4">Bienvenue sur Patrimoine Immo !</h2>
          <p className="text-muted-foreground mb-6">
            Commencez par ajouter votre premier bien immobilier pour suivre vos investissements.
          </p>
          <Link href="/dashboard">
            <Button>+ Ajouter mon premier bien</Button>
          </Link>
        </div>
      </div>
    )
  }

  const cashFlowGlobal = stats.cashFlowGlobal
  const totalLoyers = biens.reduce((sum, bien) => {
    return sum + parseFloat(bien.loyerMensuel?.toString() || "0")
  }, 0)
  const nbBiensCredit = biens.filter((b) => b.typeFinancement === "CREDIT").length
  const nbRetard = stats.loyersEnRetard

  return (
    <>
      <div className="p-8 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Vue d'ensemble de votre patrimoine immobilier</p>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPIs avec icônes */}
          <div className="grid grid-cols-4 gap-6">
            {/* Cash-flow */}
            <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Cash-flow global
                  </CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p
                  className={`text-4xl font-display font-bold ${
                    cashFlowGlobal > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {cashFlowGlobal > 0 ? "+" : ""}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(cashFlowGlobal)}
                </p>
                <p className="text-xs text-slate-500 mt-2">par mois</p>
              </CardContent>
            </Card>

            {/* Loyers */}
            <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Loyers mensuels
                  </CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-display font-bold text-primary-600">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalLoyers)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {biens.length} bien{biens.length > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Nombre de biens */}
            <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Nombre de biens
                  </CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Home className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-display font-bold text-purple-600">
                  {biens.length}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {nbBiensCredit} à crédit
                </p>
              </CardContent>
            </Card>

            {/* Alertes */}
            <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Alertes
                  </CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-display font-bold text-orange-600">
                  {nbRetard}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  loyer{nbRetard > 1 ? "s" : ""} en retard
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques globales avec icônes */}
          <div className="grid grid-cols-3 gap-6">
            <Card className="relative overflow-hidden border-0 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-primary-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total investi
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-display font-bold text-purple-600">
                  {(() => {
                    const totalInvesti = biens.reduce((sum, bien) => {
                      const initial =
                        parseFloat(bien.prixAchat?.toString() || "0") +
                        parseFloat(bien.fraisNotaire?.toString() || "0") +
                        parseFloat(bien.travauxInitiaux?.toString() || "0") +
                        parseFloat(bien.autresFrais?.toString() || "0")
                      return sum + initial
                    }, 0)
                    return new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(totalInvesti)
                  })()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Investissement initial cumulé
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <PiggyBank className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total remboursé
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-display font-bold text-green-600">
                  {(() => {
                    const totalRembourse = biens.reduce((sum, bien) => {
                      if (
                        bien.typeFinancement !== "CREDIT" ||
                        !bien.dateDebutCredit ||
                        !bien.montantCredit
                      ) {
                        return sum
                      }
                      const dateDebut = new Date(bien.dateDebutCredit)
                      const maintenant = new Date()
                      const moisEcoules = Math.max(
                        0,
                        Math.floor(
                          (maintenant.getTime() - dateDebut.getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )
                      )
                      const montantCredit = parseFloat(bien.montantCredit.toString())
                      const dureeCredit = parseInt(bien.dureeCredit?.toString() || "0")
                      if (moisEcoules >= dureeCredit) {
                        return sum + montantCredit
                      }
                      const rembourse = (montantCredit / dureeCredit) * moisEcoules
                      return sum + rembourse
                    }, 0)
                    return new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(totalRembourse)
                  })()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Capital remboursé sur tous les crédits
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Capital restant dû
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-display font-bold text-orange-600">
                  {(() => {
                    const totalRestant = biens.reduce((sum, bien) => {
                      if (
                        bien.typeFinancement !== "CREDIT" ||
                        !bien.dateDebutCredit ||
                        !bien.montantCredit
                      ) {
                        return sum
                      }
                      const dateDebut = new Date(bien.dateDebutCredit)
                      const maintenant = new Date()
                      const moisEcoules = Math.max(
                        0,
                        Math.floor(
                          (maintenant.getTime() - dateDebut.getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )
                      )
                      const montantCredit = parseFloat(bien.montantCredit.toString())
                      const dureeCredit = parseInt(bien.dureeCredit?.toString() || "0")
                      if (moisEcoules >= dureeCredit) {
                        return sum
                      }
                      const restant = montantCredit - (montantCredit / dureeCredit) * moisEcoules
                      return sum + restant
                    }, 0)
                    return new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(totalRestant)
                  })()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Sur tous les crédits en cours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenus et charges globaux */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-medium hover:shadow-large transition-all duration-300 bg-white">
              <CardHeader>
                <CardTitle>Revenus mensuels totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    return (
                      <>
                        <div>
                          <p className="text-sm text-slate-600 mb-2">Loyers mensuels</p>
                          <p className="text-3xl font-display font-bold text-primary-600">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(totalLoyers)}
                          </p>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-sm text-slate-600 mb-2">
                            Revenus annuels prévisionnels
                          </p>
                          <p className="text-2xl font-display font-bold text-primary-500">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(totalLoyers * 12)}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-medium hover:shadow-large transition-all duration-300 bg-white">
              <CardHeader>
                <CardTitle>Charges mensuelles totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const totalCharges = biens.reduce((sum, bien) => {
                      const charges = parseFloat(bien.chargesMensuelles?.toString() || "0")
                      const mensualite =
                        bien.typeFinancement === "CREDIT"
                          ? parseFloat(bien.mensualiteCredit?.toString() || "0")
                          : 0
                      return sum + charges + mensualite
                    }, 0)

                    const totalChargesSansCredit = biens.reduce((sum, bien) => {
                      return sum + parseFloat(bien.chargesMensuelles?.toString() || "0")
                    }, 0)

                    const totalMensualites = biens.reduce((sum, bien) => {
                      return bien.typeFinancement === "CREDIT"
                        ? sum + parseFloat(bien.mensualiteCredit?.toString() || "0")
                        : sum
                    }, 0)

                    return (
                      <>
                        <div>
                          <p className="text-sm text-slate-600 mb-2">Total mensuel</p>
                          <p className="text-3xl font-display font-bold text-orange-600">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(totalCharges)}
                          </p>
                        </div>
                        <div className="pt-4 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Mensualités crédits</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              }).format(totalMensualites)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Charges d'exploitation</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              }).format(totalChargesSansCredit)}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Répartition par financement */}
          <Card className="mb-6 border-0 shadow-medium hover:shadow-large transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle>Répartition par type de financement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center">
                {(() => {
                  const nbCredit = biens.filter(
                    (b) => b.typeFinancement === "CREDIT"
                  ).length
                  const nbCash = biens.filter((b) => b.typeFinancement === "CASH").length
                  const total = biens.length

                  if (total === 0) {
                    return <p className="text-slate-500">Aucun bien</p>
                  }

                  return (
                    <div className="w-full space-y-6">
                      {/* Crédit */}
                      {nbCredit > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-500 rounded" />
                              <span className="font-medium">Crédit</span>
                            </div>
                            <span className="font-bold">
                              {nbCredit} bien(s) -{" "}
                              {((nbCredit / total) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-500 h-4 rounded-full transition-all"
                              style={{ width: `${(nbCredit / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Cash */}
                      {nbCash > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded" />
                              <span className="font-medium">Cash</span>
                            </div>
                            <span className="font-bold">
                              {nbCash} bien(s) -{" "}
                              {((nbCash / total) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-green-500 h-4 rounded-full transition-all"
                              style={{ width: `${(nbCash / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
