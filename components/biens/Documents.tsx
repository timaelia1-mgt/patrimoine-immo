"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Loader2,
  FolderOpen,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/biens/KPICard"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DocumentsProps {
  bien: any
}

const CATEGORIES = [
  { value: "contrat", label: "Contrat", variant: "amber" as const, icon: FileText },
  { value: "diagnostic", label: "Diagnostic", variant: "sky" as const, icon: File },
  { value: "facture", label: "Facture", variant: "emerald" as const, icon: FileText },
  { value: "photo", label: "Photo", variant: "purple" as const, icon: ImageIcon },
  { value: "autre", label: "Autre", variant: "slate" as const, icon: File },
]

export function Documents({ bien }: DocumentsProps) {
  const supabase = createClient()
  
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("contrat")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Calculs KPIs
  const nbDocuments = documents.length
  const tailleTotal = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
  const tailleEnMo = (tailleTotal / (1024 * 1024)).toFixed(2)

  // Charger documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("bien_id", bien.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error: any) {
      console.error("Erreur chargement documents:", error?.message || error)
      // Si la table n'existe pas, on continue silencieusement
      setDocuments([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bien.id])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Upload fichier
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }

    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      // Générer nom unique
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload vers Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Créer entrée BDD
      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          bien_id: bien.id,
          user_id: user.id,
          nom: selectedFile.name,
          categorie: selectedCategory,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
        })

      if (dbError) throw dbError

      toast.success("Document uploadé avec succès")
      setSelectedFile(null)
      fetchDocuments()
    } catch (error: any) {
      console.error("Erreur upload:", error?.message || error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  // Télécharger fichier
  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.nom
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Téléchargement démarré")
    } catch (error: any) {
      console.error("Erreur téléchargement:", error?.message || error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  // Supprimer fichier
  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Supprimer "${doc.nom}" ?`)) return

    try {
      // Supprimer du Storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.file_path])

      if (storageError) throw storageError

      // Supprimer de la BDD
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id)

      if (dbError) throw dbError

      toast.success("Document supprimé")
      fetchDocuments()
    } catch (error: any) {
      console.error("Erreur suppression:", error?.message || error)
      toast.error("Erreur lors de la suppression")
    }
  }

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Format taille fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Icône selon type
  const getFileIcon = (fileType: string, categorie: string) => {
    if (fileType?.startsWith("image/")) return ImageIcon
    const category = CATEGORIES.find((c) => c.value === categorie)
    return category?.icon || File
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={FolderOpen}
          label="Documents"
          value={nbDocuments.toString()}
          subtext="fichiers uploadés"
          variant="amber"
          delay={0}
        />

        <KPICard
          icon={File}
          label="Taille totale"
          value={`${tailleEnMo} MB`}
          subtext="stockage utilisé"
          variant="sky"
          delay={100}
        />

        <KPICard
          icon={CheckCircle2}
          label="Catégories"
          value={new Set(documents.map((d) => d.categorie)).size.toString()}
          subtext="types de documents"
          variant="emerald"
          delay={200}
        />
      </div>

      {/* Upload */}
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-200">Uploader un document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection catégorie */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedCategory === cat.value
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${dragActive
                ? "border-amber-500 bg-amber-500/10"
                : "border-slate-700 bg-slate-800/50 hover:border-amber-500/50"
              }
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <Upload className={`w-12 h-12 mx-auto mb-3 ${dragActive ? "text-amber-400" : "text-slate-400"}`} />
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-400">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Glissez-déposez un fichier ici
                </p>
                <p className="text-xs text-slate-400 mb-3">ou</p>
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg cursor-pointer transition-colors"
                >
                  Parcourir
                </label>
              </>
            )}
          </div>

          {/* Bouton upload */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Liste documents */}
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-200">Documents ({nbDocuments})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Aucun document pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const category = CATEGORIES.find((c) => c.value === doc.categorie)
                const Icon = getFileIcon(doc.file_type, doc.categorie)
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${category?.value === "contrat" ? "bg-amber-500/10 border border-amber-500/20" : ""}
                        ${category?.value === "diagnostic" ? "bg-sky-500/10 border border-sky-500/20" : ""}
                        ${category?.value === "facture" ? "bg-emerald-500/10 border border-emerald-500/20" : ""}
                        ${category?.value === "photo" ? "bg-purple-500/10 border border-purple-500/20" : ""}
                        ${category?.value === "autre" ? "bg-slate-500/10 border border-slate-500/20" : ""}
                      `}>
                        <Icon className={`
                          w-5 h-5
                          ${category?.value === "contrat" ? "text-amber-400" : ""}
                          ${category?.value === "diagnostic" ? "text-sky-400" : ""}
                          ${category?.value === "facture" ? "text-emerald-400" : ""}
                          ${category?.value === "photo" ? "text-purple-400" : ""}
                          ${category?.value === "autre" ? "text-slate-400" : ""}
                        `} />
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">{doc.nom}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`
                              ${category?.value === "contrat" ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : ""}
                              ${category?.value === "diagnostic" ? "border-sky-500/50 text-sky-400 bg-sky-500/10" : ""}
                              ${category?.value === "facture" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : ""}
                              ${category?.value === "photo" ? "border-purple-500/50 text-purple-400 bg-purple-500/10" : ""}
                              ${category?.value === "autre" ? "border-slate-500/50 text-slate-400 bg-slate-500/10" : ""}
                            `}
                          >
                            {category?.label}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleDownload(doc)}
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(doc)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
