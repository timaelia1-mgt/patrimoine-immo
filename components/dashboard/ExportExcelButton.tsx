'use client'

import { useState, memo, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Settings,
  ChevronRight,
  Database
} from 'lucide-react'

interface ExportSectionProps {
  nombreBiens: number
}

export const ExportExcelButton = memo(function ExportExcelButton({ nombreBiens }: ExportSectionProps) {
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)
  const [isLoadingPDF, setIsLoadingPDF] = useState(false)

  const isAnyLoading = isLoadingExcel || isLoadingPDF

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      let errorMessage = 'Erreur lors du téléchargement'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Si pas de JSON, utiliser le message par défaut
      }
      throw new Error(errorMessage)
    }
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(blobUrl)
    document.body.removeChild(a)
  }

  const handleExportExcel = async () => {
    if (nombreBiens === 0) {
      toast.error('Aucun bien à exporter')
      return
    }

    setIsLoadingExcel(true)
    const loadingToast = toast.loading('Préparation de l\'export Excel...')

    try {
      logger.info('[Dashboard] Export Excel demandé')
      await downloadFile('/api/export/excel', `Patrimoine_Immo_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.dismiss(loadingToast)
      toast.success('Export Excel téléchargé avec succès', {
        description: `${nombreBiens} bien${nombreBiens > 1 ? 's' : ''} exporté${nombreBiens > 1 ? 's' : ''}`
      })
      logger.info('[Dashboard] Export Excel réussi', { nombreBiens })
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export'
      logger.error('[Dashboard] Erreur export Excel:', error)
      toast.error(message)
    } finally {
      setIsLoadingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (nombreBiens === 0) {
      toast.error('Aucun bien à exporter')
      return
    }

    setIsLoadingPDF(true)
    const loadingToast = toast.loading('Génération du rapport PDF...')

    try {
      logger.info('[Dashboard] Export PDF demandé')
      await downloadFile('/api/export/pdf', `Rapport_Annuel_${new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.dismiss(loadingToast)
      toast.success('Rapport PDF téléchargé avec succès', {
        description: `Rapport annuel ${new Date().getFullYear()} généré`
      })
      logger.info('[Dashboard] Export PDF réussi', { nombreBiens })
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export'
      logger.error('[Dashboard] Erreur export PDF:', error)
      toast.error(message)
    } finally {
      setIsLoadingPDF(false)
    }
  }

  return (
    <div className="mt-8 animate-in fade-in duration-500" style={{ animationDelay: '0.85s' }}>
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header avec lien vers Paramètres */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Exports rapides</h3>
                <p className="text-xs text-slate-400">Téléchargez vos données</p>
              </div>
            </div>
            <Link href="/parametres">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Plus d'options
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {/* Boutons d'export rapides */}
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Export Excel */}
              <Button
                onClick={handleExportExcel}
                disabled={isAnyLoading || nombreBiens === 0}
                className="h-auto py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex-col gap-1"
              >
                {isLoadingExcel ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isLoadingExcel ? 'Export...' : 'Excel'}
                </span>
                <span className="text-xs opacity-70">.xlsx</span>
              </Button>
              
              {/* Export PDF */}
              <Button
                onClick={handleExportPDF}
                disabled={isAnyLoading || nombreBiens === 0}
                className="h-auto py-4 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg shadow-rose-500/20 disabled:opacity-50 flex-col gap-1"
              >
                {isLoadingPDF ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isLoadingPDF ? 'Génération...' : 'Rapport PDF'}
                </span>
                <span className="text-xs opacity-70">.pdf</span>
              </Button>
              
              {/* Lien Import/Backup */}
              <Link href="/parametres" className="block">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 px-4 border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white flex-col gap-1"
                >
                  <Database className="w-5 h-5" />
                  <span className="text-sm font-medium">Import & Backup</span>
                  <span className="text-xs opacity-70">CSV, JSON</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
