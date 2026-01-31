'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle } from 'lucide-react'

interface PatrimoineChartProps {
  biens: any[]
}

// Calcule le montant total investi dans un bien
function calculateMontantInvestissement(bien: any): number {
  const prixAchat = bien.prixAchat || 0
  const fraisNotaire = bien.fraisNotaire || 0
  const travaux = bien.travauxInitiaux || 0
  const autresFrais = bien.autresFrais || 0
  
  const total = prixAchat + fraisNotaire + travaux + autresFrais
  
  // Si aucune donnée d'investissement n'est renseignée, on garde l'ancienne estimation
  if (total === 0) {
    return (bien.loyerMensuel || 0) * 12 * 15
  }
  
  return total
}

// Vérifie si tous les biens ont leurs données d'investissement
function checkDonneesInvestissementCompletes(biens: any[]): {
  complete: boolean
  biensManquants: string[]
} {
  const biensManquants: string[] = []
  
  biens.forEach(bien => {
    const hasData = (bien.prixAchat || 0) > 0 || 
                    (bien.fraisNotaire || 0) > 0 || 
                    (bien.travauxInitiaux || 0) > 0 || 
                    (bien.autresFrais || 0) > 0
    
    if (!hasData) {
      biensManquants.push(bien.nom)
    }
  })
  
  return {
    complete: biensManquants.length === 0,
    biensManquants
  }
}

// Fonction pour calculer l'évolution du patrimoine net
function calculatePatrimoineEvolution(biens: any[]) {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1)
  const endDate = new Date(now.getFullYear() + 20, now.getMonth(), 1)
  
  const dataPoints = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    let patrimoineTotal = 0
    
    biens.forEach(bien => {
      const montantInvestissement = calculateMontantInvestissement(bien)
      
      if (bien.typeFinancement === 'CASH') {
        // Pour un bien comptant, le patrimoine = montant investi (constant)
        patrimoineTotal += montantInvestissement
        
      } else if (bien.typeFinancement === 'CREDIT') {
        const dateDebutCredit = bien.dateDebutCredit 
          ? new Date(bien.dateDebutCredit) 
          : new Date(bien.createdAt)
        
        const dureeMois = bien.dureeCredit || 240
        
        // Utiliser montantCredit s'il existe, sinon montantInvestissement
        const montantTotal = bien.montantCredit || montantInvestissement
        const mensualiteCapital = montantTotal / dureeMois
        
        const moisEcoules = Math.max(
          0,
          (currentDate.getFullYear() - dateDebutCredit.getFullYear()) * 12 +
            (currentDate.getMonth() - dateDebutCredit.getMonth())
        )
        
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
    
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1)
  }
  
  return dataPoints
}

export function PatrimoineChart({ biens }: PatrimoineChartProps) {
  const data = calculatePatrimoineEvolution(biens)
  const currentValue = data.find(d => d.isNow)?.patrimoine || 0
  const projectedValue = data[data.length - 1]?.patrimoine || 0
  const donneesInvestissement = checkDonneesInvestissementCompletes(biens)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-1000">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Évolution du Patrimoine Net
        </h2>
        <p className="text-slate-400">
          Votre richesse réelle qui grandit mois après mois avec les remboursements de crédit
        </p>
      </div>

      {/* Message d'avertissement si données incomplètes */}
      {!donneesInvestissement.complete && (
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-300 mb-1">
                📊 Patrimoine estimé (données d'investissement manquantes)
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Les montants affichés sont des <strong className="text-amber-200">approximations</strong> basées sur vos loyers. 
                Pour un calcul précis, complétez la section <strong className="text-amber-200">Investissement</strong> de vos biens.
              </p>
              {donneesInvestissement.biensManquants.length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Biens concernés : {donneesInvestissement.biensManquants.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
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
                }).format(currentValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-1">Projection 20 ans</p>
              <p className="text-2xl font-bold text-amber-400">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }).format(projectedValue)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
                    // Extraire l'année de la date (format: "avr. 2026" ou "janv. 2024")
                    const yearMatch = value?.match(/\d{4}/)
                    if (!yearMatch) return ''
                    
                    const year = yearMatch[0]
                    const currentYear = new Date().getFullYear()
                    const yearNum = parseInt(year)
                    
                    // Calculer le nombre total de points de données
                    const totalPoints = data.length
                    
                    // Afficher environ 8-10 labels sur toute la période
                    const interval = Math.max(1, Math.floor(totalPoints / 8))
                    
                    // Afficher si c'est un multiple de l'intervalle, ou le premier/dernier
                    if (index % interval === 0 || index === 0 || index === totalPoints - 1) {
                      // Toujours afficher l'année complète pour plus de clarté
                      return year
                    }
                    return ''
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Formatage amélioré avec espace et meilleure lisibilité
                    if (value >= 1000000) {
                      // Pour les millions : "1,5 M€"
                      return `${(value / 1000000).toFixed(1).replace('.', ',')} M€`
                    } else if (value >= 1000) {
                      // Pour les milliers : "160 k€" avec espace
                      return `${(value / 1000).toFixed(0)} k€`
                    } else {
                      // Pour les petites valeurs : format complet
                      return new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(value)
                    }
                  }}
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
  )
}
