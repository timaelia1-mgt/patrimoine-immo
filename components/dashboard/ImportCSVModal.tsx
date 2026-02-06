'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Download, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'

interface ImportCSVModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportCSVModal({ isOpen, onClose }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return
    
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Format invalide', {
        description: 'Le fichier doit être au format CSV (.csv)'
      })
      return
    }
    if (selectedFile.size === 0) {
      toast.error('Fichier vide', {
        description: 'Le fichier sélectionné ne contient aucune donnée'
      })
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', {
        description: `Taille: ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB. Maximum autorisé: 5MB`
      })
      return
    }
    setFile(selectedFile)
    toast.success(`Fichier sélectionné: ${selectedFile.name}`)
    logger.info('[ImportCSV] Fichier sélectionné', { name: selectedFile.name, size: selectedFile.size })
  }
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }
  
  const handleDragLeave = () => {
    setDragOver(false)
  }
  
  const handleImport = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier CSV')
      return
    }
    
    setLoading(true)
    const loadingToast = toast.loading('Import en cours...')
    
    try {
      logger.info('[ImportCSV] Import démarré', { filename: file.name })
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      toast.dismiss(loadingToast)
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erreur lors de l\'import'
        throw new Error(errorMessage)
      }
      
      logger.info('[ImportCSV] Import réussi', result)
      
      // Message de succès avec détails
      if (result.warnings && result.warnings.length > 0) {
        toast.warning(`${result.imported} bien(s) importé(s) avec ${result.warnings.length} avertissement(s)`, {
          description: 'Certaines données ont été ignorées. Vérifiez les biens importés.',
          duration: 6000
        })
        logger.warn('[ImportCSV] Avertissements:', result.warnings)
      } else {
        toast.success(`${result.imported} bien(s) importé(s) avec succès !`, {
          description: result.biens?.slice(0, 3).join(', ') + (result.biens?.length > 3 ? '...' : ''),
          duration: 5000
        })
      }
      
      // Info supplémentaire après un court délai
      if (result.imported > 0) {
        setTimeout(() => {
          toast.info('Vos nouveaux biens sont maintenant visibles dans le dashboard', {
            duration: 4000
          })
        }, 1500)
      }
      
      // Recharger la page pour voir les nouveaux biens
      router.refresh()
      
      // Fermer le modal après 1.5s
      setTimeout(() => {
        handleClose()
      }, 1500)
      
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      logger.error('[ImportCSV] Erreur import:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur lors de l\'import CSV'
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClose = () => {
    setFile(null)
    setDragOver(false)
    onClose()
  }
  
  const handleDownloadTemplate = () => {
    const template = `nom,adresse,codePostal,ville,typeFinancement,prixAchat,fraisNotaire,travauxInitiaux,autresFrais,montantCredit,tauxCredit,dureeCredit,mensualiteCredit,loyerMensuel,taxeFonciere,chargesCopro,assurance,fraisGestion,autresCharges,dateAcquisition,dateMiseEnLocation,dateDebutCredit
Appartement Paris 10e,10 rue de la Paix,75010,Paris,credit,250000,18000,15000,5000,200000,2.5,240,850,1200,100,80,30,0,20,2023-01-15,2023-02-01,2023-01-20
Studio Lyon 6e,25 avenue Foch,69006,Lyon,comptant,120000,9000,5000,2000,,,,,650,50,40,20,0,10,2022-06-01,2022-07-01,
Maison Bordeaux,12 rue des Vignes,33000,Bordeaux,credit,400000,30000,25000,10000,320000,3.2,300,1400,1800,200,0,45,100,30,2021-09-15,2021-11-01,2021-10-01`
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modele_import_biens.csv'
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Modèle CSV téléchargé')
    logger.info('[ImportCSV] Template téléchargé')
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl text-white">
            <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            Importer des biens depuis CSV
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Importez vos biens depuis un fichier CSV. Maximum 50 biens par import.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Format attendu */}
          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-300 mb-2">
                  Format attendu
                </h4>
                <p className="text-sm text-blue-200/70 mb-2">
                  <span className="font-medium text-blue-200">Colonne obligatoire :</span> nom
                </p>
                <p className="text-sm text-blue-200/70 mb-3">
                  <span className="font-medium text-blue-200">Colonnes optionnelles :</span> adresse, codePostal, ville, typeFinancement (credit/comptant), prixAchat, fraisNotaire, travauxInitiaux, loyerMensuel, taxeFonciere, chargesCopro, assurance, dateAcquisition...
                </p>
                <Button 
                  onClick={handleDownloadTemplate} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-600 text-blue-300 hover:bg-blue-900/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le modèle CSV
                </Button>
              </div>
            </div>
          </div>
          
          {/* Zone de drop */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
              ${dragOver 
                ? 'border-purple-400 bg-purple-900/30' 
                : file 
                  ? 'border-emerald-500 bg-emerald-900/20' 
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center text-center">
              {file ? (
                <>
                  <div className="p-3 bg-emerald-500/20 rounded-full mb-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="font-medium text-emerald-300 mb-1">{file.name}</p>
                  <p className="text-sm text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="mt-2 text-slate-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Retirer
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-700 rounded-full mb-3">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-300 mb-1">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-sm text-slate-500">
                    ou cliquez pour sélectionner (max 5MB)
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || loading}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importer les biens
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
