'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { QuittanceData } from '@/lib/generateQuittance'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface QuittanceModalProps {
  isOpen: boolean
  onClose: () => void
  data: QuittanceData
  locataireEmail?: string | null
}

export function QuittanceModal({ isOpen, onClose, data, locataireEmail }: QuittanceModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingDownload, setLoadingDownload] = useState(false)
  const [datePayeLocataire, setDatePayeLocataire] = useState('')
  const [datePayeAPL, setDatePayeAPL] = useState('')

  // Pré-remplir les dates quand le modal s'ouvre
  useEffect(() => {
    if (data && isOpen) {
      const today = format(new Date(), 'yyyy-MM-dd')
      setDatePayeLocataire(today)
      setDatePayeAPL(today)
    }
  }, [data, isOpen])

  if (!isOpen) return null

  const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  const handleClose = () => {
    if (loading || loadingDownload) {
      if (confirm('Une opération est en cours. Voulez-vous vraiment fermer ?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleDownload = async () => {
    // Validation des dates
    if (!datePayeLocataire) {
      toast.error('Veuillez sélectionner la date de paiement du locataire')
      return
    }
    
    if (data.montantAPL > 0 && !datePayeAPL) {
      toast.error('Veuillez sélectionner la date de paiement APL')
      return
    }
    
    // Vérifier que les dates ne sont pas trop dans le futur
    const today = new Date()
    const dateLocataire = new Date(datePayeLocataire)
    const diffJoursLocataire = Math.floor((dateLocataire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffJoursLocataire > 30) {
      toast.error('La date de paiement locataire ne peut pas être à plus de 30 jours dans le futur')
      return
    }
    
    if (data.montantAPL > 0 && datePayeAPL) {
      const dateAPL = new Date(datePayeAPL)
      const diffJoursAPL = Math.floor((dateAPL.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffJoursAPL > 30) {
        toast.error('La date de paiement APL ne peut pas être à plus de 30 jours dans le futur')
        return
      }
    }
    
    setLoadingDownload(true)
    
    try {
      // Import dynamique de jsPDF pour réduire le bundle initial (~200KB)
      const { generateQuittancePDF } = await import('@/lib/generateQuittance')
      
      const quittanceData: QuittanceData = {
        ...data,
        datePayeLocataire,
        datePayeAPL,
      }

      const doc = generateQuittancePDF(quittanceData)
      doc.save(`Quittance_${MOIS_NOMS[data.mois - 1]}_${data.annee}_${data.bienNom.replace(/\s+/g, '_')}.pdf`)

      logger.info('[QuittanceModal] PDF téléchargé', {
        bienId: data.bienId,
        mois: data.mois,
        annee: data.annee
      })

      // Sauvegarder en DB (silencieux si erreur)
      try {
        await fetch(`/api/biens/${data.bienId}/quittances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mois: data.mois,
            annee: data.annee,
            locataireNom: data.locataireNom,
            locatairePrenom: data.locatairePrenom,
            locataireEmail: locataireEmail || null,
            montantLocataire: data.montantLocataire,
            montantAPL: data.montantAPL,
            datePayeLocataire,
            datePayeAPL: data.montantAPL > 0 ? datePayeAPL : null,
            modePaiement: data.modePaiement,
            emailEnvoye: false,
          })
        })
      } catch (dbError: unknown) {
        logger.error('[QuittanceModal] Erreur sauvegarde DB:', dbError)
      }

      toast.success('Quittance téléchargée et sauvegardée')
    } catch (error: unknown) {
      logger.error('[QuittanceModal] Erreur téléchargement PDF:', error)
      toast.error('Erreur lors du téléchargement de la quittance')
    } finally {
      setLoadingDownload(false)
    }
  }

  const handleSendEmail = async () => {
    // Validation des dates
    if (!datePayeLocataire) {
      toast.error('Veuillez sélectionner la date de paiement du locataire')
      return
    }
    
    if (data.montantAPL > 0 && !datePayeAPL) {
      toast.error('Veuillez sélectionner la date de paiement APL')
      return
    }
    
    // Vérifier que les dates ne sont pas trop dans le futur
    const today = new Date()
    const dateLocataire = new Date(datePayeLocataire)
    const diffJoursLocataire = Math.floor((dateLocataire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffJoursLocataire > 30) {
      toast.error('La date de paiement locataire ne peut pas être à plus de 30 jours dans le futur')
      return
    }
    
    if (data.montantAPL > 0 && datePayeAPL) {
      const dateAPL = new Date(datePayeAPL)
      const diffJoursAPL = Math.floor((dateAPL.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffJoursAPL > 30) {
        toast.error('La date de paiement APL ne peut pas être à plus de 30 jours dans le futur')
        return
      }
    }
    
    if (!locataireEmail) {
      toast.error('Email du locataire non configuré. Ajoutez-le dans l\'enrichissement Locataire.')
      return
    }

    setLoading(true)

    try {
      // Import dynamique de jsPDF pour réduire le bundle initial (~200KB)
      const { generateQuittancePDF } = await import('@/lib/generateQuittance')
      
      const quittanceData: QuittanceData = {
        ...data,
        datePayeLocataire,
        datePayeAPL,
      }

      const doc = generateQuittancePDF(quittanceData)

      // Convertir le PDF en base64
      const pdfBase64 = doc.output('datauristring').split(',')[1]

      logger.info('[QuittanceModal] Envoi email quittance', {
        bienId: data.bienId,
        locataireEmail,
        mois: data.mois,
        annee: data.annee
      })

      const response = await fetch('/api/send-quittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          locataireEmail,
          locataireNom: data.locataireNom,
          locatairePrenom: data.locatairePrenom,
          mois: data.mois,
          annee: data.annee,
          bienNom: data.bienNom,
          bienId: data.bienId,
          montantLocataire: data.montantLocataire,
          montantAPL: data.montantAPL,
          datePayeLocataire,
          datePayeAPL: data.montantAPL > 0 ? datePayeAPL : null,
          modePaiement: data.modePaiement,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }

      logger.info('[QuittanceModal] Email envoyé avec succès', {
        bienId: data.bienId,
        locataireEmail
      })

      toast.success('Email envoyé avec succès au locataire !')

      // Fermer le modal après 1.5s
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error: unknown) {
      logger.error('[QuittanceModal] Erreur envoi email:', error)

      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur lors de l\'envoi'

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">📄 Quittance de loyer</h2>
            <p className="text-sm text-slate-400 mt-1">
              {MOIS_NOMS[data.mois - 1]} {data.annee}
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Résumé */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Locataire</span>
            <span className="text-white font-medium">{data.locatairePrenom} {data.locataireNom}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Bien</span>
            <span className="text-white font-medium">{data.bienNom}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Loyer</span>
            <span className="text-white font-medium">{data.montantLocataire.toFixed(2)} €</span>
          </div>
          {data.montantAPL > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">APL</span>
              <span className="text-white font-medium">{data.montantAPL.toFixed(2)} €</span>
            </div>
          )}
          <div className="border-t border-slate-600 pt-2 flex justify-between text-sm">
            <span className="text-slate-300 font-semibold">Total</span>
            <span className="text-emerald-400 font-bold">{(data.montantLocataire + data.montantAPL).toFixed(2)} €</span>
          </div>
        </div>

        {/* Dates de paiement */}
        <div className="space-y-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            📅 Dates de paiement
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date paiement locataire
              </label>
              <input
                type="date"
                value={datePayeLocataire}
                onChange={(e) => setDatePayeLocataire(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Date où le locataire a payé
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date paiement APL
              </label>
              <input
                type="date"
                value={datePayeAPL}
                onChange={(e) => setDatePayeAPL(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Date où l'APL a été versée
              </p>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>Info :</strong> Les dates de paiement ne peuvent pas être à plus de 30 jours dans le futur.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-8">
          <Button 
            onClick={handleDownload} 
            disabled={loadingDownload || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingDownload ? '⏳ Téléchargement...' : '📥 Télécharger le PDF'}
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || loadingDownload || !locataireEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '📧 Envoi...' : '📧 Envoyer par email au locataire'}
          </Button>
          {!locataireEmail && (
            <p className="text-slate-500 text-xs text-center">
              Email du locataire non configuré
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
