"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useQueryClient } from "@tanstack/react-query"
import { PLANS } from "@/lib/stripe"
import type { PlanType } from "@/lib/stripe"
import type { Bien } from "@/lib/database"
import { useProfile } from "@/lib/hooks/use-profile"
import { calculateChargesMensuelles } from "@/lib/calculations"
import { ExportExcelButton } from "@/components/dashboard/ExportExcelButton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  Plus,
  TrendingUp,
  Home,
  DollarSign,
  Wallet,
  MapPin,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"

// Lazy-load du modal pour réduire le bundle initial
const UpgradeModal = dynamic(
  () => import("@/components/modals/UpgradeModal").then(mod => ({ default: mod.UpgradeModal })),
  { ssr: false }
)

// Lazy-load PatrimoineChart (inclut Recharts ~50KB)
const PatrimoineChart = dynamic(
  () => import("@/components/dashboard/PatrimoineChart").then(mod => ({ default: mod.PatrimoineChart })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-in fade-in duration-500">
        <div className="mb-8">
          <div className="h-8 w-64 bg-slate-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="border border-[var(--color-border-primary)]/50 bg-slate-800/50 rounded-2xl p-6 h-96 animate-pulse" />
      </div>
    ),
  }
)

// Lazy-load BienFormDialog (chargé uniquement quand l'utilisateur clique "Ajouter un bien")
const BienFormDialog = dynamic(
  () => import("@/components/biens/BienFormDialog").then(mod => ({ default: mod.BienFormDialog })),
  {
    ssr: false,
    loading: () => null,
  }
)

interface DashboardClientProps {
  biens: Bien[]
  userId: string
}

// Fonction pour calculer les stats
function calculateStats(biens: Bien[]) {
  if (!biens || !Array.isArray(biens)) {
    return {
      totalLoyers: 0,
      totalCharges: 0,
      totalMensualites: 0,
      totalCashFlow: 0,
      nombreBiens: 0
    }
  }

  let totalLoyers = 0
  let totalCharges = 0
  let totalMensualites = 0

  biens.forEach((bien) => {
    const loyer = parseFloat(bien.loyerMensuel?.toString() || "0") || 0
    totalLoyers += loyer

    // Utiliser la fonction centralisée
    const charges = calculateChargesMensuelles(bien)
    totalCharges += charges

    if (bien.typeFinancement === 'CREDIT') {
      const mensualite = parseFloat(bien.mensualiteCredit?.toString() || "0") || 0
      totalMensualites += mensualite
    }
  })

  const totalCashFlow = totalLoyers - totalCharges - totalMensualites

  return {
    totalLoyers: isNaN(totalLoyers) ? 0 : totalLoyers,
    totalCharges: isNaN(totalCharges) ? 0 : totalCharges,
    totalMensualites: isNaN(totalMensualites) ? 0 : totalMensualites,
    totalCashFlow: isNaN(totalCashFlow) ? 0 : totalCashFlow,
    nombreBiens: biens.length
  }
}

export function DashboardClient({ biens, userId }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // Fetch profile via React Query (cache 10 min)
  const { data: profile } = useProfile({ userId })

  // Valeurs dérivées
  const stats = useMemo(() => calculateStats(biens), [biens])
  const planType = useMemo(() => (profile?.plan || 'gratuit') as PlanType, [profile])
  const maxBiens = useMemo(() => {
    const plan = PLANS[planType]
    if (!plan) return PLANS['gratuit'].maxBiens
    return plan.maxBiens
  }, [planType])

  const currentBiens = biens.length
  const canCreateBien = useMemo(
    () => maxBiens === null || currentBiens < maxBiens,
    [maxBiens, currentBiens]
  )
  const remainingBiens = useMemo(
    () => maxBiens === null ? null : Math.max(0, maxBiens - currentBiens),
    [maxBiens, currentBiens]
  )

  // Vérifier si on doit ouvrir le dialog depuis l'URL
  useEffect(() => {
    const handleOpenDialog = () => {
      if (!canCreateBien) {
        setUpgradeModalOpen(true)
        return
      }
      
      setDialogOpen(true)
    }

    try {
      const addParam = searchParams?.get("add")
      if (addParam === "true") {
        handleOpenDialog()
        // Nettoyer l'URL après un court délai
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete("add")
          window.history.replaceState({}, "", url.pathname + url.search)
        }, 100)
      }
    } catch (error) {
      // Fallback si useSearchParams ne fonctionne pas
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        if (params.get("add") === "true") {
          handleOpenDialog()
          setTimeout(() => {
            const url = new URL(window.location.href)
            url.searchParams.delete("add")
            window.history.replaceState({}, "", url.pathname + url.search)
          }, 100)
        }
      }
    }
  }, [searchParams, canCreateBien])

  const handleSuccess = () => {
    // 1. Fermer le dialog d'abord
    setDialogOpen(false)
    
    // 2. Invalider le cache React Query pour rafraîchir biens (Dashboard + Sidebar)
    queryClient.invalidateQueries({ queryKey: ['biens', userId] })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 lg:pt-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 border-b border-[var(--color-border-primary)]/50">
        <div className="relative px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-5 h-5 text-[var(--color-brand-secondary)]" />
              <span className="text-[var(--color-brand-secondary)] opacity-80 text-xs font-medium tracking-wider uppercase">
                Votre Patrimoine
              </span>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-[var(--color-brand-secondary)] mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Tableau de Bord
            </h1>
            <p className="text-[var(--color-text-secondary)] text-base max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Vue d&apos;ensemble de vos {stats.nombreBiens} {stats.nombreBiens > 1 ? 'biens immobiliers' : 'bien immobilier'}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Premium */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Cash Flow */}
            <div className="animate-in fade-in duration-500" style={{ animationDelay: '0.3s' }}>
              <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-[var(--color-border-brand)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-success-glow">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stats.totalCashFlow > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stats.totalLoyers > 0 ? (
                        <>
                          {stats.totalCashFlow > 0 ? '↑' : '↓'}{' '}
                          {Math.abs((stats.totalCashFlow / stats.totalLoyers) * 100).toFixed(1)}%
                        </>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Cash-flow Mensuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-4xl font-bold ${
                    stats.totalCashFlow > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    }).format(stats.totalCashFlow)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">Par mois</p>
                </CardContent>
              </Card>
            </div>

            {/* Loyers */}
            <div className="animate-in fade-in duration-500" style={{ animationDelay: '0.4s' }}>
              <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-[var(--color-border-brand)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Loyers Totaux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-400">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    }).format(stats.totalLoyers)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">Par mois</p>
                </CardContent>
              </Card>
            </div>

            {/* Charges */}
            <div className="animate-in fade-in duration-500" style={{ animationDelay: '0.5s' }}>
              <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-[var(--color-border-brand)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Charges Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-400">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    }).format(stats.totalCharges + stats.totalMensualites)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">Par mois</p>
                </CardContent>
              </Card>
            </div>

            {/* Nombre de biens */}
            <div className="animate-in fade-in duration-500" style={{ animationDelay: '0.6s' }}>
              <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-[var(--color-border-brand)] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Portefeuille
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-400">
                    {stats.nombreBiens}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">{stats.nombreBiens > 1 ? 'Biens' : 'Bien'}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section Export Excel */}
          {biens.length > 0 && (
            <ExportExcelButton nombreBiens={biens.length} />
          )}

          {/* Section Mes Biens */}
          {biens.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Mes Biens
                  </h2>
                  <p className="text-[var(--color-text-secondary)]">
                    {biens.length} {biens.length > 1 ? 'propriétés' : 'propriété'} dans votre portefeuille
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {biens.map((bien, index) => {
                  const charges = calculateChargesMensuelles(bien)
                  const mensualite = bien.typeFinancement === 'CREDIT' ? (bien.mensualiteCredit || 0) : 0
                  const cashflow = (bien.loyerMensuel || 0) - charges - mensualite

                  return (
                    <div
                      key={bien.id}
                      className="animate-in fade-in duration-500"
                      style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                    >
                      <Card className="relative border border-[var(--color-border-primary)]/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
                        {/* Decorative corner */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-brand-secondary)]/10 to-transparent rounded-bl-[100px]" />

                        <CardHeader className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold text-white mb-2">
                                {bien.nom}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{bien.ville}</span>
                              </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              bien.typeFinancement === 'CASH'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {bien.typeFinancement === 'CASH' ? 'Comptant' : 'Crédit'}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Loyer */}
                          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-[var(--color-text-secondary)] text-sm">Loyer mensuel</span>
                            <span className="text-white font-semibold">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0
                              }).format(bien.loyerMensuel || 0)}
                            </span>
                          </div>

                          {/* Cash-flow du bien */}
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700/50">
                            <span className="text-[var(--color-text-secondary)] text-sm font-medium">Cash-flow</span>
                            <span className={`font-bold ${cashflow > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {cashflow > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0
                              }).format(cashflow)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="pt-2">
                            <Link href={`/biens/${bien.id}`}>
                              <Button
                                variant="ghost"
                                className="w-full justify-between text-[var(--color-brand-secondary)] hover:text-[var(--color-brand-tertiary)] hover:bg-[var(--color-brand-primary)]/10 group/btn"
                              >
                                <span>Voir les détails</span>
                                <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Graphique d'évolution du patrimoine */}
          {biens.length > 0 && (
            <div className="mt-12 animate-in fade-in duration-500" style={{ animationDelay: '1s' }}>
              <PatrimoineChart biens={biens} />
            </div>
          )}

          {/* Message d'accueil si aucun bien */}
          {biens.length === 0 && (
            <div className="text-center max-w-lg mx-auto py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-secondary)]/20 to-[var(--color-brand-muted)]/20 rounded-full blur-3xl"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-[var(--color-brand-secondary)]/20 to-[var(--color-brand-muted)]/20 rounded-full flex items-center justify-center mx-auto border border-[var(--color-border-brand)]">
                  <Home className="w-16 h-16 text-[var(--color-brand-secondary)]" />
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4">
                Commencez votre aventure immobilière
              </h2>

              <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed text-lg">
                Ajoutez votre premier bien pour suivre vos investissements, calculer votre patrimoine et optimiser votre rentabilité.
              </p>

              <Link href="/dashboard?add=true">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-muted)] hover:from-[var(--color-brand-muted)] hover:to-[var(--color-brand-primary)] text-white transition-all duration-300 hover:scale-105 px-8 py-6 text-lg font-semibold shadow-brand-glow hover:shadow-[var(--shadow-brand-lg)]"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Ajouter mon premier bien
                </Button>
              </Link>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Suivez votre patrimoine</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">Visualisez l&apos;évolution de votre richesse immobilière</p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Optimisez vos revenus</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">Analysez votre cash-flow et rentabilité</p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Wallet className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Gérez vos charges</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">Suivez tous vos coûts et dépenses</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicateurs de limite de biens */}
      {biens.length > 0 && (
        <div className="px-8 pb-4">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header avec badge de limite et bouton ajouter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {maxBiens !== null && (
                  <Badge 
                    variant={remainingBiens !== null && remainingBiens <= 0 ? 'destructive' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {currentBiens} / {maxBiens} biens
                  </Badge>
                )}
                {maxBiens === null && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {currentBiens} biens (illimité)
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={() => {
                  if (canCreateBien) {
                    setDialogOpen(true)
                  } else {
                    setUpgradeModalOpen(true)
                  }
                }}
                disabled={false}
                className={`group ${
                  canCreateBien
                    ? 'bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-muted)] hover:from-[var(--color-brand-muted)] hover:to-[var(--color-brand-primary)] text-white shadow-brand-glow'
                    : 'bg-slate-700 text-[var(--color-text-secondary)] cursor-pointer hover:bg-slate-600'
                }`}
              >
                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
                {canCreateBien ? 'Ajouter un bien' : 'Limite atteinte'}
              </Button>
            </div>

            {/* Alerte si proche de la limite */}
            {maxBiens !== null && remainingBiens !== null && remainingBiens > 0 && remainingBiens <= 2 && (
              <Alert className="bg-[var(--color-brand-primary)]/10 border-[var(--color-border-brand)]">
                <AlertCircle className="h-4 w-4 text-[var(--color-brand-primary)]" />
                <AlertTitle className="text-[var(--color-brand-secondary)]">Limite presque atteinte</AlertTitle>
                <AlertDescription className="text-[var(--color-text-secondary)]">
                  Il vous reste {remainingBiens} bien{remainingBiens > 1 ? 's' : ''} disponible{remainingBiens > 1 ? 's' : ''} sur votre plan {PLANS[planType]?.name ?? 'Gratuit'}.{' '}
                  <Button variant="link" className="p-0 h-auto text-[var(--color-brand-secondary)] hover:text-[var(--color-brand-tertiary)]" asChild>
                    <Link href="/abonnement">Passer à un plan supérieur</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Alerte si limite atteinte */}
            {maxBiens !== null && remainingBiens !== null && remainingBiens <= 0 && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atteinte</AlertTitle>
                <AlertDescription>
                  Vous avez atteint la limite de {maxBiens} bien{maxBiens > 1 ? 's' : ''} de votre plan {PLANS[planType]?.name ?? 'Gratuit'}.{' '}
                  <Button variant="link" className="p-0 h-auto text-red-300 hover:text-red-200 underline" asChild>
                    <Link href="/abonnement">Passer à un plan supérieur</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      <BienFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
      {maxBiens !== null && (
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlan={PLANS[planType]?.name ?? 'Gratuit'}
          currentCount={currentBiens}
          maxBiens={maxBiens}
        />
      )}
    </div>
  )
}
