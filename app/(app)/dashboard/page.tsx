import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBiens } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Home, 
  DollarSign, 
  Wallet,
  MapPin,
  Calendar,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Désactiver le cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fonction pour calculer les stats
function calculateStats(biens: any[]) {
  let totalLoyers = 0
  let totalCharges = 0
  let totalMensualites = 0

  biens.forEach((bien) => {
    totalLoyers += bien.loyerMensuel || 0
    const charges = (bien.taxeFonciere || 0) / 12 +
      (bien.chargesCopro || 0) +
      (bien.assurance || 0) +
      (bien.fraisGestion || 0) +
      (bien.autresCharges || 0)
    totalCharges += charges
    if (bien.typeFinancement === 'CREDIT') {
      totalMensualites += bien.mensualiteCredit || 0
    }
  })

  const totalCashFlow = totalLoyers - totalCharges - totalMensualites

  return {
    totalLoyers,
    totalCharges,
    totalMensualites,
    totalCashFlow,
    nombreBiens: biens.length
  }
}

// Fonction pour calculer l'évolution du patrimoine net
function calculatePatrimoineEvolution(biens: any[]) {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1) // Commence il y a 2 ans
  const endDate = new Date(now.getFullYear() + 20, now.getMonth(), 1) // Projette sur 20 ans
  
  const dataPoints = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    let patrimoineTotal = 0
    
    biens.forEach(bien => {
      if (bien.typeFinancement === 'CASH') {
        // Bien comptant = valeur constante (on utilise loyer * 12 * 15 comme estimation de valeur)
        patrimoineTotal += (bien.loyerMensuel || 0) * 12 * 15
      } else if (bien.typeFinancement === 'CREDIT') {
        // Bien à crédit : calculer le capital remboursé
        const dateDebutCredit = bien.dateDebutCredit ? new Date(bien.dateDebutCredit) : new Date(bien.createdAt)
        const dureeMois = bien.dureeCredit || 240
        const montantTotal = bien.montantCredit || ((bien.loyerMensuel || 0) * 12 * 15)
        const mensualiteCapital = montantTotal / dureeMois
        
        // Calculer les mois écoulés depuis le début du crédit
        const moisEcoules = Math.max(0, 
          (currentDate.getFullYear() - dateDebutCredit.getFullYear()) * 12 + 
          (currentDate.getMonth() - dateDebutCredit.getMonth())
        )
        
        // Capital remboursé (plafonné à la durée totale)
        const capitalRembourse = Math.min(mensualiteCapital * moisEcoules, montantTotal)
        patrimoineTotal += capitalRembourse
      }
    })
    
    dataPoints.push({
      date: currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      patrimoine: Math.round(patrimoineTotal),
      isPast: currentDate <= now,
      isNow: currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()
    })
    
    // Passer au mois suivant (tous les 3 mois pour réduire les points)
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1)
  }
  
  return dataPoints
}

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/login')
    }

    // Passer le client Supabase serveur à getBiens
    const biens = await getBiens(user.id, supabase)
    const stats = calculateStats(biens)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section - SANS effets de background */}
        <div className="relative overflow-hidden bg-slate-950 border-b border-slate-800/50">
          <div className="relative px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400/80 text-xs font-medium tracking-wider uppercase">
                  Votre Patrimoine
                </span>
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-400 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Tableau de Bord
              </h1>
              <p className="text-slate-400 text-base max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                Vue d'ensemble de vos {stats.nombreBiens} {stats.nombreBiens > 1 ? 'biens immobiliers' : 'bien immobilier'}
              </p>
            </div>
          </div>
        </div>

        {/* KPIs Premium - SANS overlap */}
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Cash Flow */}
              <div className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stats.totalCashFlow > 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {stats.totalCashFlow > 0 ? '↑' : '↓'} {Math.abs((stats.totalCashFlow / stats.totalLoyers * 100) || 0).toFixed(1)}%
                      </span>
                    </div>
                    <CardTitle className="text-sm font-medium text-slate-400">
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
                    <p className="text-xs text-slate-500 mt-2">Par mois</p>
                  </CardContent>
                </Card>
              </div>

              {/* Loyers */}
              <div className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-medium text-slate-400">
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
                    <p className="text-xs text-slate-500 mt-2">Par mois</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charges */}
              <div className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/30">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-medium text-slate-400">
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
                    <p className="text-xs text-slate-500 mt-2">Par mois</p>
                  </CardContent>
                </Card>
              </div>

              {/* Nombre de biens */}
              <div className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                        <Home className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Portefeuille
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-purple-400">
                      {stats.nombreBiens}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{stats.nombreBiens > 1 ? 'Biens' : 'Bien'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Section Mes Biens */}
            {biens.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Mes Biens
                    </h2>
                    <p className="text-slate-400">
                      {biens.length} {biens.length > 1 ? 'propriétés' : 'propriété'} dans votre portefeuille
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {biens.map((bien, index) => {
                    const charges = (bien.taxeFonciere || 0) / 12 +
                      (bien.chargesCopro || 0) +
                      (bien.assurance || 0) +
                      (bien.fraisGestion || 0) +
                      (bien.autresCharges || 0)
                    const mensualite = bien.typeFinancement === 'CREDIT' ? (bien.mensualiteCredit || 0) : 0
                    const cashflow = (bien.loyerMensuel || 0) - charges - mensualite

                    return (
                      <div 
                        key={bien.id} 
                        className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700"
                        style={{ animationDelay: `${800 + index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <Card className="relative border border-slate-800/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                          {/* Decorative corner */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-bl-[100px]" />
                          
                          <CardHeader className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <CardTitle className="text-xl font-bold text-white mb-2">
                                  {bien.nom}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
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
                              <span className="text-slate-400 text-sm">Loyer mensuel</span>
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
                              <span className="text-slate-400 text-sm font-medium">Cash-flow</span>
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
                                  className="w-full justify-between text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 group/btn"
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
              <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-1000">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Évolution du Patrimoine Net
                  </h2>
                  <p className="text-slate-400">
                    Votre richesse réelle qui grandit mois après mois avec les remboursements de crédit
                  </p>
                </div>
                
                <Card className="border border-slate-800/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-white mb-2">
                          Patrimoine Actuel
                        </CardTitle>
                        <p className="text-4xl font-bold text-emerald-400">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0
                          }).format(calculatePatrimoineEvolution(biens).find(d => d.isNow)?.patrimoine || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400 mb-1">Projection 20 ans</p>
                        <p className="text-2xl font-bold text-amber-400">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0
                          }).format(calculatePatrimoineEvolution(biens)[calculatePatrimoineEvolution(biens).length - 1]?.patrimoine || 0)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={calculatePatrimoineEvolution(biens)}>
                          <defs>
                            <linearGradient id="colorPatrimoine" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value, index) => {
                              // Afficher seulement certains labels pour éviter le chevauchement
                              const data = calculatePatrimoineEvolution(biens)
                              if (index % 4 === 0 || index === data.length - 1) return value
                              return ''
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '8px' }}
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value: any) => [
                              new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0
                              }).format(value),
                              'Patrimoine Net'
                            ]}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="patrimoine" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fill="url(#colorPatrimoine)"
                            dot={(props: any) => {
                              const { cx, cy, payload } = props
                              if (payload.isNow) {
                                return (
                                  <g>
                                    <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
                                    <circle cx={cx} cy={cy} r={10} fill="#10b981" opacity={0.2} />
                                  </g>
                                )
                              }
                              return null
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <span className="text-slate-400">Patrimoine accumulé</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-slate-400">Aujourd'hui</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <span className="text-slate-400">Projection</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Message d'accueil si aucun bien */}
            {biens.length === 0 && (
              <div className="text-center max-w-md mx-auto py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="w-12 h-12 text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Bienvenue sur Patrimoine Immo
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Commencez par ajouter votre premier bien immobilier pour suivre vos investissements avec élégance.
                </p>
              </div>
            )}
          </div>
        </div>

        <DashboardClient biens={biens} stats={stats} />
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }
}
