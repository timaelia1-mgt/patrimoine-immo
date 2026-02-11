"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign,
  Wallet,
  Landmark,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency } from "@/lib/calculations"
import { getLocataires, upsertLocataire, deleteLocataire, getLots } from "@/lib/database"
import { toast } from "sonner"

interface LocatairesListProps {
  bien: any
}

const MODE_PAIEMENT_OPTIONS = [
  { value: "virement", label: "Virement", variant: "emerald" },
  { value: "prelevement", label: "Prélèvement", variant: "sky" },
  { value: "cheque", label: "Chèque", variant: "purple" },
  { value: "especes", label: "Espèces", variant: "orange" },
] as const

export function LocatairesList({ bien }: LocatairesListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [locataires, setLocataires] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    id: "",
    lotId: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateEntree: "",
    montantAPL: "0",
    modePaiement: "virement",
  })

  // Calculs globaux
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  const totalAPL = locataires.reduce((sum, loc) => sum + parseFloat(loc.montantAPL || "0"), 0)
  const totalNetLocataires = loyerMensuel - totalAPL

  // Charger locataires ET lots en parallèle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [locatairesData, lotsData] = await Promise.all([
          getLocataires(bien.id),
          getLots(bien.id)
        ])
        setLocataires(locatairesData)
        setLots(lotsData)
      } catch (error) {
        console.error("Erreur chargement:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [bien.id])

  const resetForm = () => {
    setFormData({
      id: "",
      lotId: "",
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      dateEntree: "",
      montantAPL: "0",
      modePaiement: "virement",
    })
    setEditingId(null)
    setAdding(false)
  }

  const startEdit = (locataire: any) => {
    setFormData({
      id: locataire.id,
      lotId: locataire.lotId || "",
      nom: locataire.nom,
      prenom: locataire.prenom,
      email: locataire.email || "",
      telephone: locataire.telephone || "",
      dateEntree: locataire.dateEntree || "",
      montantAPL: locataire.montantAPL?.toString() || "0",
      modePaiement: locataire.modePaiement || "virement",
    })
    setEditingId(locataire.id)
    setAdding(false)
  }

  const handleSave = async () => {
    if (!formData.nom || !formData.prenom) {
      toast.error("Le nom et le prénom sont obligatoires")
      return
    }

    try {
      setSaving(true)

      // Validation du lot sélectionné
      if (!formData.lotId) {
        toast.error("Veuillez sélectionner un lot")
        return
      }

      await upsertLocataire(bien.id, formData.lotId, {
        id: formData.id || undefined,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email || null,
        telephone: formData.telephone || null,
        dateEntree: formData.dateEntree || null,
        montantAPL: parseFloat(formData.montantAPL || "0"),
        modePaiement: formData.modePaiement,
      })

      toast.success(formData.id ? "Locataire modifié" : "Locataire ajouté")
      
      // Recharger
      const data = await getLocataires(bien.id)
      setLocataires(data)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce locataire ?")) return

    try {
      await deleteLocataire(id)
      toast.success("Locataire supprimé")
      
      const data = await getLocataires(bien.id)
      setLocataires(data)
      router.refresh()
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
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
      {/* KPIs financiers */}
      {locataires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            icon={Wallet}
            label="Loyer mensuel total"
            value={formatCurrency(loyerMensuel)}
            subtext="Charges comprises"
            variant="amber"
            delay={0}
          />

          <KPICard
            icon={Landmark}
            label="Total APL"
            value={formatCurrency(totalAPL)}
            subtext={`${locataires.length} locataire${locataires.length > 1 ? "s" : ""}`}
            variant="purple"
            delay={100}
          />

          <KPICard
            icon={DollarSign}
            label="Total reste à charge"
            value={formatCurrency(totalNetLocataires)}
            subtext="Parts locataires"
            variant="emerald"
            delay={200}
          />
        </div>
      )}

      {/* Liste des locataires */}
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200">
              Locataires ({locataires.length})
            </CardTitle>
            {!adding && !editingId && (
              <Button
                onClick={() => {
                  const lotParDefaut = lots.find(l => l.estLotDefaut)
                  setFormData({
                    ...formData,
                    id: "",
                    lotId: lotParDefaut?.id || (lots[0]?.id || ""),
                    nom: "",
                    prenom: "",
                    email: "",
                    telephone: "",
                    dateEntree: "",
                    montantAPL: "0",
                    modePaiement: "virement",
                  })
                  setAdding(true)
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un locataire
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire ajout/édition */}
          {(adding || editingId) && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sélection du lot */}
                  <div className="md:col-span-2">
                    <Label className="text-slate-300">
                      Lot <span className="text-red-400">*</span>
                    </Label>
                    <select
                      value={formData.lotId}
                      onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                      required
                    >
                      <option value="">Sélectionner un lot</option>
                      {lots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          {lot.numeroLot} - {formatCurrency(lot.loyerMensuel)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-slate-300">
                      Nom <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">
                      Prénom <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Téléphone</Label>
                    <Input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Date d&apos;entrée</Label>
                    <Input
                      type="date"
                      value={formData.dateEntree}
                      onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Montant APL (€/mois)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.montantAPL}
                      onChange={(e) => setFormData({ ...formData, montantAPL: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-slate-300">Mode de paiement</Label>
                    <select
                      value={formData.modePaiement}
                      onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {MODE_PAIEMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    onClick={resetForm}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des locataires existants */}
          {locataires.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Aucun locataire pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locataires.map((locataire) => (
                <div
                  key={locataire.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-slate-200">
                          {locataire.prenom} {locataire.nom}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        {locataire.email && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3 h-3" />
                            {locataire.email}
                          </div>
                        )}
                        {locataire.telephone && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-3 h-3" />
                            {locataire.telephone}
                          </div>
                        )}
                        {locataire.dateEntree && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(locataire.dateEntree).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/50">
                          {lots.find(l => l.id === locataire.lotId)?.numeroLot || "N/A"}
                        </Badge>
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/50">
                          APL: {formatCurrency(parseFloat(locataire.montantAPL || "0"))}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/50">
                          Reste: {formatCurrency(loyerMensuel - parseFloat(locataire.montantAPL || "0"))}
                        </Badge>
                        <Badge
                          className={`
                            ${locataire.modePaiement === "virement" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50" : ""}
                            ${locataire.modePaiement === "prelevement" ? "bg-sky-500/10 text-sky-400 border-sky-500/50" : ""}
                            ${locataire.modePaiement === "cheque" ? "bg-purple-500/10 text-purple-400 border-purple-500/50" : ""}
                            ${locataire.modePaiement === "especes" ? "bg-orange-500/10 text-orange-400 border-orange-500/50" : ""}
                          `}
                        >
                          {MODE_PAIEMENT_OPTIONS.find((opt) => opt.value === locataire.modePaiement)?.label || locataire.modePaiement}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => startEdit(locataire)}
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(locataire.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
