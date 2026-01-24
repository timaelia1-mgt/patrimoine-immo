"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { formatCurrency, calculerCashFlow, calculerStatutBien } from "@/lib/calculations"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

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
        fetch("/api/biens")
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

  const evolutionData = [
    { mois: "Janv", cashflow: stats.cashFlowGlobal * 0.7 },
    { mois: "Févr", cashflow: stats.cashFlowGlobal * 0.75 },
    { mois: "Mars", cashflow: stats.cashFlowGlobal * 0.8 },
    { mois: "Avr", cashflow: stats.cashFlowGlobal * 0.85 },
    { mois: "Mai", cashflow: stats.cashFlowGlobal * 0.9 },
    { mois: "Juin", cashflow: stats.cashFlowGlobal },
  ]

  const repartitionData = [
    { name: "Autofinancés", value: stats.repartition.autofinances, color: "#22c55e" },
    { name: "Partiels", value: stats.repartition.partiels, color: "#eab308" },
    { name: "Non autofinancés", value: stats.repartition.nonAutofinances, color: "#ef4444" },
    { name: "Financés", value: stats.repartition.finances, color: "#10b981" },
  ].filter(item => item.value > 0)

  const biensAvecCashFlow = biens.map(b => ({
    ...b,
    cashFlow: calculerCashFlow(b)
  }))
  const top3 = [...biensAvecCashFlow].sort((a, b) => b.cashFlow - a.cashFlow).slice(0, 3)
  const flop3 = [...biensAvecCashFlow].sort((a, b) => a.cashFlow - b.cashFlow).slice(0, 3)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre patrimoine immobilier</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash-flow global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              stats.cashFlowGlobal > 0 ? "text-green-600" :
              stats.cashFlowGlobal < 0 ? "text-red-600" : "text-yellow-600"
            }`}>
              {stats.cashFlowGlobal > 0 ? "+" : ""}{formatCurrency(stats.cashFlowGlobal)}
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
              {stats.nombreBiens} bien{stats.nombreBiens > 1 ? 's' : ''}
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
              {stats.repartition.autofinances + stats.repartition.finances} rentable{(stats.repartition.autofinances + stats.repartition.finances) > 1 ? 's' : ''}
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
            <p className={`text-3xl font-bold ${stats.loyersEnRetard > 0 ? "text-red-600" : ""}`}>
              {stats.loyersEnRetard}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              loyer{stats.loyersEnRetard > 1 ? 's' : ''} en retard
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution du cash-flow</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cashflow" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Cash-flow"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des biens</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={repartitionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {repartitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Top 3 performances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3.map((bien, index) => {
              const statut = calculerStatutBien(bien)
              return (
                <Link key={bien.id} href={`/biens/${bien.id}`}>
                  <div className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">#{index + 1} {bien.nom}</span>
                      <span className="text-lg font-bold text-green-600">
                        +{formatCurrency(bien.cashFlow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{bien.ville}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          statut.couleur === "green" ? "border-green-500 text-green-700" :
                          statut.couleur === "yellow" ? "border-yellow-500 text-yellow-700" :
                          "border-red-500 text-red-700"
                        }
                      >
                        {statut.badge}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Biens à surveiller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flop3.map((bien) => {
              const statut = calculerStatutBien(bien)
              return (
                <Link key={bien.id} href={`/biens/${bien.id}`}>
                  <div className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{bien.nom}</span>
                      <span className={`text-lg font-bold ${
                        bien.cashFlow >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {bien.cashFlow > 0 ? "+" : ""}{formatCurrency(bien.cashFlow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{bien.ville}</span>
                      <Badge 
                        variant="outline"
                        className={
                          statut.couleur === "green" ? "border-green-500 text-green-700" :
                          statut.couleur === "yellow" ? "border-yellow-500 text-yellow-700" :
                          "border-red-500 text-red-700"
                        }
                      >
                        {statut.badge}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tous mes biens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {biens.map(bien => {
              const cashFlow = calculerCashFlow(bien)
              const statut = calculerStatutBien(bien)
              
              return (
                <Link key={bien.id} href={`/biens/${bien.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{bien.nom}</CardTitle>
                          <p className="text-sm text-muted-foreground">{bien.ville}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={
                            statut.couleur === "green" ? "border-green-500 text-green-700" :
                            statut.couleur === "yellow" ? "border-yellow-500 text-yellow-700" :
                            statut.couleur === "orange" ? "border-orange-500 text-orange-700" :
                            "border-red-500 text-red-700"
                          }
                        >
                          {statut.badge}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Loyer</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(bien.loyerMensuel))}/mois
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cash-flow</span>
                        <span className={`font-bold ${
                          cashFlow > 0 ? "text-green-600" :
                          cashFlow < 0 ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {cashFlow > 0 ? "+" : ""}{formatCurrency(cashFlow)}
                        </span>
                      </div>

                      {bien.typeFinancement !== "CASH" && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Autofinancement</span>
                            <span>{Math.round(statut.taux)}%</span>
                          </div>
                          <Progress value={Math.min(statut.taux, 100)} className="h-2" />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {statut.label}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
