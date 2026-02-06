'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import type { QuittanceData } from '@/lib/generateQuittance'

interface Quittance {
  id: string
  bien_id: string
  mois: number
  annee: number
  locataire_nom: string
  locataire_prenom: string
  locataire_email: string | null
  montant_locataire: number
  montant_apl: number
  montant_total: number
  date_paye_locataire: string
  date_paye_apl: string | null
  mode_paiement: string
  email_envoye: boolean
  date_envoi_email: string | null
  created_at: string
}

interface HistoriqueQuittancesProps {
  bienId: string
  bienNom: string
  bienAdresse: string
  bienVille: string
  bienCodePostal: string
  proprietaireNom: string
}

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export function HistoriqueQuittances({
  bienId,
  bienNom,
  bienAdresse,
  bienVille,
  bienCodePostal,
  proprietaireNom,
}: HistoriqueQuittancesProps) {
  const [quittances, setQuittances] = useState<Quittance[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchQuittances()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId])

  const fetchQuittances = async () => {
    try {
      const response = await fetch(`/api/biens/${bienId}/quittances`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      setQuittances(data.quittances || [])
    } catch (error: unknown) {
      logger.error('[HistoriqueQuittances] Erreur chargement:', error)
      toast.error('Impossible de charger l\'historique des quittances')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenererPDF = async (quittance: Quittance) => {
    try {
      setDownloadingId(quittance.id)
      
      // Import dynamique de jsPDF pour réduire le bundle initial (~200KB)
      const { generateQuittancePDF } = await import('@/lib/generateQuittance')
      
      const quittanceData: QuittanceData = {
        bienId: quittance.bien_id,
        bienNom,
        bienAdresse,
        bienVille,
        bienCodePostal,
        proprietaireNom,
        locataireNom: quittance.locataire_nom,
        locatairePrenom: quittance.locataire_prenom,
        locataireEmail: quittance.locataire_email,
        annee: quittance.annee,
        mois: quittance.mois,
        datePayeLocataire: quittance.date_paye_locataire,
        datePayeAPL: quittance.date_paye_apl || '',
        modePaiement: quittance.mode_paiement,
        montantLocataire: quittance.montant_locataire,
        montantAPL: quittance.montant_apl,
      }
      
      const doc = generateQuittancePDF(quittanceData)
      doc.save(`Quittance_${MOIS_NOMS[quittance.mois - 1]}_${quittance.annee}_${bienNom.replace(/\s+/g, '_')}.pdf`)
      
      logger.info('[HistoriqueQuittances] PDF régénéré', {
        bienId,
        quittanceId: quittance.id,
        mois: quittance.mois,
        annee: quittance.annee
      })
      
      toast.success('Quittance téléchargée')
    } catch (error: unknown) {
      logger.error('[HistoriqueQuittances] Erreur régénération PDF:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📄 Historique des quittances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quittances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📄 Historique des quittances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">Aucune quittance générée pour ce bien</p>
            <p className="text-xs text-slate-400">
              Les quittances apparaîtront ici après leur première génération
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📄 Historique des quittances</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {quittances.length} quittance{quittances.length > 1 ? 's' : ''}
            </Badge>
            <Button
              onClick={() => {
                setLoading(true)
                fetchQuittances()
              }}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="h-8 w-8 p-0"
              title="Actualiser"
            >
              {loading ? '⏳' : '🔄'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quittances.map((quittance) => (
            <div
              key={quittance.id}
              className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {MOIS_NOMS[quittance.mois - 1]} {quittance.annee}
                  </h4>
                  {quittance.email_envoye && (
                    <Badge className="bg-emerald-500 text-white">
                      ✓ Email envoyé
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-medium">Locataire :</span>{' '}
                    {quittance.locataire_prenom} {quittance.locataire_nom}
                  </div>
                  <div>
                    <span className="font-medium">Montant :</span>{' '}
                    {quittance.montant_total.toFixed(2)} €
                  </div>
                  <div>
                    <span className="font-medium">Payé le :</span>{' '}
                    {format(new Date(quittance.date_paye_locataire), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  <div>
                    <span className="font-medium">Généré le :</span>{' '}
                    {format(new Date(quittance.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                
                {quittance.email_envoye && quittance.date_envoi_email && (
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Email envoyé le {format(new Date(quittance.date_envoi_email), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => handleRegenererPDF(quittance)}
                disabled={downloadingId === quittance.id}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                {downloadingId === quittance.id ? '⏳' : '📥'} Télécharger
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            💡 <strong>Astuce :</strong> Vous pouvez régénérer n'importe quelle quittance en cliquant sur &quot;Télécharger&quot;.
            Les quittances sont conservées indéfiniment.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
