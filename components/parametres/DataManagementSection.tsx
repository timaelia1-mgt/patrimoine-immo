'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Upload, 
  Database, 
  Lightbulb,
  FolderDown,
  FolderUp
} from 'lucide-react'

// Lazy-load du modal pour réduire le bundle initial (~300 lignes)
const ImportCSVModal = dynamic(
  () => import('@/components/dashboard/ImportCSVModal').then(mod => ({ default: mod.ImportCSVModal })),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
  }
)

export function DataManagementSection() {
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)
  const [isLoadingPDF, setIsLoadingPDF] = useState(false)
  const [isLoadingBackup, setIsLoadingBackup] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const isAnyLoading = isLoadingExcel || isLoadingPDF || isLoadingBackup

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
    setIsLoadingExcel(true)
    const loadingToast = toast.loading('Préparation de l\'export Excel...')

    try {
      logger.info('[Parametres] Export Excel demandé')
      await downloadFile('/api/export/excel', `Patrimoine_Immo_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.dismiss(loadingToast)
      toast.success('Export Excel téléchargé avec succès')
      logger.info('[Parametres] Export Excel réussi')
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export'
      logger.error('[Parametres] Erreur export Excel:', error)
      toast.error(message)
    } finally {
      setIsLoadingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    setIsLoadingPDF(true)
    const loadingToast = toast.loading('Génération du rapport PDF...')

    try {
      logger.info('[Parametres] Export PDF demandé')
      await downloadFile('/api/export/pdf', `Rapport_Annuel_${new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.dismiss(loadingToast)
      toast.success('Rapport PDF téléchargé avec succès')
      logger.info('[Parametres] Export PDF réussi')
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export'
      logger.error('[Parametres] Erreur export PDF:', error)
      toast.error(message)
    } finally {
      setIsLoadingPDF(false)
    }
  }

  const handleBackup = async () => {
    // Confirmation avant backup
    const confirmed = window.confirm(
      'Créer un backup complet de vos données ?\n\n' +
      'Le fichier JSON contiendra tous vos biens, quittances, loyers et locataires.'
    )
    
    if (!confirmed) {
      return
    }

    setIsLoadingBackup(true)
    const loadingToast = toast.loading('Création du backup en cours...')

    try {
      logger.info('[Parametres] Backup demandé')
      await downloadFile('/api/backup', `Backup_Patrimoine_Immo_${new Date().toISOString().split('T')[0]}.json`)
      toast.dismiss(loadingToast)
      toast.success('Backup créé avec succès !', {
        description: 'Conservez ce fichier en lieu sûr pour restaurer vos données si nécessaire.',
        duration: 6000
      })
      logger.info('[Parametres] Backup réussi')
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Erreur lors du backup'
      logger.error('[Parametres] Erreur backup:', error)
      toast.error(message)
    } finally {
      setIsLoadingBackup(false)
    }
  }

  return (
    <>
      {/* Section Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-emerald-500" />
            Exporter mes données
          </CardTitle>
          <CardDescription>
            Téléchargez vos données pour la comptabilité ou les déclarations fiscales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Excel */}
            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Export Excel
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Tableau complet avec toutes les données financières
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                      ✓ Format .xlsx
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                      ✓ Comptabilité
                    </span>
                  </div>
                  <LoadingButton
                    onClick={handleExportExcel}
                    disabled={isAnyLoading}
                    loading={isLoadingExcel}
                    loadingText="Export en cours..."
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger .xlsx
                  </LoadingButton>
                </div>
              </div>
            </div>
            
            {/* Export PDF */}
            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Rapport PDF
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Rapport annuel professionnel avec statistiques
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full">
                      ✓ Design pro
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full">
                      ✓ Déclarations
                    </span>
                  </div>
                  <LoadingButton
                    onClick={handleExportPDF}
                    disabled={isAnyLoading}
                    loading={isLoadingPDF}
                    loadingText="Génération..."
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Télécharger .pdf
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Import & Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-purple-500" />
            Import & Sauvegarde
          </CardTitle>
          <CardDescription>
            Importez vos données ou créez une sauvegarde complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import CSV */}
            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Import CSV
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Migrez vos biens depuis un autre outil
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      ✓ Max 50 biens
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      ✓ Modèle fourni
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsImportModalOpen(true)}
                    disabled={isAnyLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importer .csv
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Backup JSON */}
            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Backup complet
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Sauvegardez toutes vos données en JSON
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                      ✓ Toutes données
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                      ✓ Réimportable
                    </span>
                  </div>
                  <LoadingButton
                    onClick={handleBackup}
                    disabled={isAnyLoading}
                    loading={isLoadingBackup}
                    loadingText="Création..."
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Télécharger .json
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
          
          {/* Info box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Recommandations
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Export Excel</strong> : pour votre comptabilité mensuelle</li>
                  <li>• <strong>Rapport PDF</strong> : pour vos déclarations fiscales annuelles</li>
                  <li>• <strong>Backup JSON</strong> : à faire régulièrement (1 fois par mois)</li>
                  <li>• <strong>Import CSV</strong> : uniquement lors de la migration initiale</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Import CSV */}
      <ImportCSVModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </>
  )
}
