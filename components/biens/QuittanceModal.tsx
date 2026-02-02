'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateQuittancePDF, QuittanceData } from '@/lib/generateQuittance'

interface QuittanceModalProps {
  isOpen: boolean
  onClose: () => void
  data: QuittanceData
  locataireEmail?: string | null
}

export function QuittanceModal({ isOpen, onClose, data, locataireEmail }: QuittanceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  const handleDownload = () => {
    const doc = generateQuittancePDF(data)
    doc.save(`Quittance_${MOIS_NOMS[data.mois - 1]}_${data.annee}_${data.bienNom.replace(/\s+/g, '_')}.pdf`)
  }

  const handleSendEmail = async () => {
    if (!locataireEmail) {
      setError('Email du locataire non configuré. Ajoutez-le dans l\'enrichissement Locataire.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const doc = generateQuittancePDF(data)
      // Convertir le PDF en base64
      const pdfBase64 = doc.output('datauristring').split(',')[1]

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
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }

      setSuccess('Email envoyé avec succès au locataire !')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi')
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
            onClick={onClose} 
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

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
            📥 Télécharger le PDF
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || !locataireEmail}
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
