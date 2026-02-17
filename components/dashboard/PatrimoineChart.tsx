'use client'

import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/logger'

// Taux d'appréciation immobilière moyen utilisé pour estimer la valeur des biens comptants.
// Valeur historique moyenne en France : ~2% par an sur le long terme.
const APPRECIATION_ANNUELLE = 0.02

interface PatrimoineChartProps {
  biens: any[]
}

// Calcule le montant total investi dans un bien
// Retourne 0 si les données sont manquantes (pas d'estimation)
function calculateMontantInvestissement(bien: any): number {
  const prixAchat = bien.prixAchat || 0
  const fraisNotaire = bien.fraisNotaire || 0
  const travaux = bien.travauxInitiaux || 0
  const autresFrais = bien.autresFrais || 0
  
  const total = prixAchat + fraisNotaire + travaux + autresFrais
  
  // Si aucune donnée d'investissement n'est renseignée, retourner 0
  // Le graphique affichera un avertissement pour inciter à compléter les données
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

// Helper pour récupérer une date d'acquisition valide
function getDateAcquisition(bien: any): Date {
  if (bien.dateAcquisition) {
    const d = new Date(bien.dateAcquisition)
    if (!isNaN(d.getTime())) return d
  }
  if (bien.createdAt) {
    const d = new Date(bien.createdAt)
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

// Helper pour récupérer une date de début de crédit valide
function getDateDebutCredit(bien: any): Date {
  if (bien.dateDebutCredit) {
    const d = new Date(bien.dateDebutCredit)
    if (!isNaN(d.getTime())) return d
  }
  if (bien.createdAt) {
    const d = new Date(bien.createdAt)
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

// Fonction pour calculer l'évolution du patrimoine net (2 courbes)
function calculatePatrimoineEvolution(biens: any[]) {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1)
  const endDate = new Date(now.getFullYear() + 20, now.getMonth(), 1)
  
  const dataPoints = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    let patrimoineReel = 0
    let patrimoineEstime = 0
    
    biens.forEach(bien => {
      const montantInvestissement = calculateMontantInvestissement(bien)
      
      // Si pas de données d'investissement, on ne compte pas ce bien
      if (montantInvestissement === 0) return

      const isComptant = bien.typeFinancement?.toLowerCase() === 'comptant'
      const isCredit = bien.typeFinancement?.toLowerCase() === 'credit'
      
      console.log('[Chart] bien:', bien.nom, 'typeFinancement:', bien.typeFinancement, 'isComptant:', isComptant, 'isCredit:', isCredit)
      
      if (isComptant) {
        // ---- BIEN COMPTANT ----
        const dateAcquisition = getDateAcquisition(bien)
        if (dateAcquisition > currentDate) return // pas encore acquis

        const anneesEcoulees = Math.max(
          0,
          (currentDate.getFullYear() - dateAcquisition.getFullYear()) +
            (currentDate.getMonth() - dateAcquisition.getMonth()) / 12
        )
        
        // Réel : montant investi (pas d'amortissement, c'est du comptant)
        patrimoineReel += montantInvestissement
        
        // Estimé : montant investi + appréciation 2%/an
        const valeurEstimee = montantInvestissement * Math.pow(1 + APPRECIATION_ANNUELLE, anneesEcoulees)
        patrimoineEstime += valeurEstimee
        
      } else if (isCredit) {
        // ---- BIEN À CRÉDIT ----
        const dateDebutCredit = getDateDebutCredit(bien)
        if (dateDebutCredit > currentDate) return // crédit pas encore commencé
        
        const dureeMois = bien.dureeCredit || 240
        if (dureeMois <= 0 || dureeMois > 600) return // durée invalide
        
        const montantTotal = bien.montantCredit || montantInvestissement
        
        const moisEcoules = Math.max(
          0,
          (currentDate.getFullYear() - dateDebutCredit.getFullYear()) * 12 +
            (currentDate.getMonth() - dateDebutCredit.getMonth())
        )
        
        // Calcul du capital remboursé avec amortissement dégressif
        const taux = (bien.tauxCredit || 0) / 100 / 12
        const mensualite = bien.mensualiteCredit || 0
        
        let capitalRembourse = 0
        
        if (moisEcoules > 0 && taux > 0 && mensualite > 0) {
          const capitalRestant = montantTotal * Math.pow(1 + taux, moisEcoules) -
                                 mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)
          capitalRembourse = montantTotal - Math.max(0, Math.min(montantTotal, capitalRestant))
        } else if (moisEcoules >= dureeMois) {
          capitalRembourse = montantTotal
        }
        
        const capitalReelBien = Math.max(0, capitalRembourse)
        
        // Réel : capital remboursé uniquement
        patrimoineReel += capitalReelBien
        
        // Estimation : valeur du bien sur le marché (appréciation 2%/an) - capital restant dû
        const dateDebut = getDateDebutCredit(bien)
        const anneesEcoulees = Math.max(0,
          (currentDate.getFullYear() - dateDebut.getFullYear()) +
          (currentDate.getMonth() - dateDebut.getMonth()) / 12
        )
        const valeurMarcheBien = montantInvestissement * Math.pow(1 + APPRECIATION_ANNUELLE, anneesEcoulees)
        const capitalRestantDu = Math.max(0, montantTotal - capitalRembourse)
        const patrimoineNetEstime = valeurMarcheBien - capitalRestantDu
        patrimoineEstime += Math.max(0, patrimoineNetEstime)
      }
    })
    
    dataPoints.push({
      date: currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      patrimoineReel: Math.round(patrimoineReel),
      patrimoineEstime: Math.round(patrimoineEstime),
      isPast: currentDate <= now,
      isNow: currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()
    })
    
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1)
  }
  
  return dataPoints
}

export const PatrimoineChart = memo(function PatrimoineChart({ biens }: PatrimoineChartProps) {
  // Mémoïser le calcul du patrimoine pour éviter les recalculs inutiles
  const { data, hasError } = useMemo(() => {
    let calculatedData: any[] = []
    let error = false
    
    try {
      calculatedData = calculatePatrimoineEvolution(biens)
    } catch (err) {
      logger.error('[PatrimoineChart] Erreur calcul:', err)
      error = true
      calculatedData = []
    }
    
    return { data: calculatedData, hasError: error }
  }, [biens])
  
  // Mémoïser les valeurs calculées
  const currentValue = useMemo(
    () => data.find(d => d.isNow)?.patrimoineReel || 0,
    [data]
  )
  
  const projectedValue = useMemo(
    () => data[data.length - 1]?.patrimoineEstime || 0,
    [data]
  )
  
  const donneesInvestissement = useMemo(
    () => checkDonneesInvestissementCompletes(biens),
    [biens]
  )
  
  // Si erreur, afficher un message au lieu du graphique
  if (hasError || data.length === 0) {
    return (
      <div className="animate-in fade-in duration-500" style={{ animationDelay: '1s' }}>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Évolution du Patrimoine Net
          </h2>
          <p className="text-slate-400">
            Votre richesse réelle qui grandit mois après mois
          </p>
        </div>
        
        <Card className="border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold text-red-300 mb-2">
                Impossible de calculer le patrimoine
              </h4>
              <p className="text-sm text-slate-300">
                Une erreur s&apos;est produite lors du calcul. Vérifiez que tous vos biens ont des données valides (dates, montants, etc.).
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: '1s' }}>
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
                📊 Données d&apos;investissement manquantes
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Complétez la section <strong className="text-amber-200">Investissement</strong> de vos biens pour voir l&apos;évolution réelle de votre patrimoine.
              </p>
              {donneesInvestissement.biensManquants.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {donneesInvestissement.biensManquants.map((nom, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-amber-500/10 text-amber-300 rounded-md border border-amber-500/20">
                      {nom}
                    </span>
                  ))}
                </div>
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
              <p className="text-sm text-slate-400 mb-1">Estimation 20 ans ⚠️</p>
              <p className="text-2xl font-bold text-amber-400">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }).format(projectedValue)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Basée sur +2%/an (indicatif)</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEstime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value, index) => {
                    const yearMatch = value?.match(/\d{4}/)
                    if (!yearMatch) return ''
                    
                    const year = yearMatch[0]
                    const totalPoints = data.length
                    const interval = Math.max(1, Math.floor(totalPoints / 8))
                    
                    if (index % interval === 0 || index === 0 || index === totalPoints - 1) {
                      return year
                    }
                    return ''
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1).replace('.', ',')} M€`
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)} k€`
                    } else {
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
                  formatter={(value: any, name?: string) => {
                    const label = name === 'patrimoineEstime'
                      ? 'Estimation marché'
                      : 'Capital remboursé'
                    return [
                      new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0
                      }).format(value),
                      label
                    ]
                  }}
                />
                {/* Area estimation (pointillés, amber) */}
                <Area
                  type="monotone"
                  dataKey="patrimoineEstime"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#colorEstime)"
                  dot={false}
                  name="patrimoineEstime"
                />
                {/* Area réel (solide, emerald) */}
                <Area 
                  type="monotone" 
                  dataKey="patrimoineReel" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#colorReel)"
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
                    return <g />
                  }}
                  name="patrimoineReel"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Légende + Disclaimer */}
          <div className="mt-4 space-y-3">
            {/* Légende */}
            <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-emerald-400"></div>
                <span className="text-slate-400">Capital remboursé (réel)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{borderTop: '2px dashed #F59E0B', background: 'none'}}></div>
                <span className="text-slate-400">Estimation valeur marché</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">Aujourd&apos;hui</span>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                ⚠️ <strong className="text-slate-400">Estimation indicative uniquement.</strong> La courbe pointillée amber projette 
                une appréciation immobilière de +2%/an (moyenne historique France). Elle ne tient pas compte 
                de la vacance locative, travaux imprévus, évolution du marché ni de la fiscalité. 
                La courbe verte représente uniquement le capital réellement remboursé.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
