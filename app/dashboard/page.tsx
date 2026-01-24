"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency } from "@/lib/calculations"

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre patrimoine immobilier
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash-flow global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
                stats.cashFlowGlobal > 0
                  ? "text-green-600"
                  : stats.cashFlowGlobal < 0
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {stats.cashFlowGlobal > 0 ? "+" : ""}
              {formatCurrency(stats.cashFlowGlobal)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">par mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Loyers mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.loyersMensuels)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.nombreBiens} bien{stats.nombreBiens > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nombre de biens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.nombreBiens}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.repartition.autofinances + stats.repartition.finances} rentable
              {stats.repartition.autofinances + stats.repartition.finances > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className={stats.loyersEnRetard > 0 ? "bg-red-50 border-red-200" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
                stats.loyersEnRetard > 0 ? "text-red-600" : ""
              }`}
            >
              {stats.loyersEnRetard}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              loyer{stats.loyersEnRetard > 1 ? "s" : ""} en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques globales du patrimoine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total investi */}
        <Card className="border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total investi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
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
                }).format(totalInvesti)
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Investissement initial cumulé
            </p>
          </CardContent>
        </Card>

        {/* Total remboursé */}
        <Card className="border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total remboursé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
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
                }).format(totalRembourse)
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Capital remboursé sur tous les crédits
            </p>
          </CardContent>
        </Card>

        {/* Capital restant dû */}
        <Card className="border-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Capital restant dû
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
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
                }).format(totalRestant)
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sur tous les crédits en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenus et charges globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus mensuels totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const totalLoyers = biens.reduce((sum, bien) => {
                  return sum + parseFloat(bien.loyerMensuel?.toString() || "0")
                }, 0)

                return (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Loyers mensuels
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(totalLoyers)}
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Revenus annuels prévisionnels
                      </p>
                      <p className="text-2xl font-bold text-blue-500">
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

        <Card>
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
                      <p className="text-sm text-muted-foreground mb-2">
                        Total mensuel
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(totalCharges)}
                      </p>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Mensualités crédits
                        </span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(totalMensualites)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Charges d'exploitation
                        </span>
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
      <Card className="mb-6">
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
                return <p className="text-muted-foreground">Aucun bien</p>
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
  )
}
