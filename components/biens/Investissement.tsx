"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Home, 
  FileText, 
  Wrench, 
  PlusCircle, 
  DollarSign, 
  Trash2,
  Calculator 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency } from "@/lib/calculations"
import { 
  getInvestissementsSecondaires, 
  createInvestissementSecondaire, 
  deleteInvestissementSecondaire,
  type InvestissementSecondaire
} from "@/lib/database"
import { toast } from "sonner"

interface InvestissementProps {
  bien: any
}

export function Investissement({ bien }: InvestissementProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // État investissement initial
  const [formData, setFormData] = useState({
    prixAchat: bien.prixAchat?.toString() || "0",
    fraisNotaire: bien.fraisNotaire?.toString() || "0",
    travauxInitiaux: bien.travauxInitiaux?.toString() || "0",
    autresFrais: bien.autresFrais?.toString() || "0",
  })

  // État investissements secondaires
  const [investissementsSecondaires, setInvestissementsSecondaires] = useState<InvestissementSecondaire[]>([])
  const [loadingSecondaires, setLoadingSecondaires] = useState(true)
  const [formSecondaire, setFormSecondaire] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    montant: "",
  })

  // Calculs
  const investissementInitial = 
    parseFloat(formData.prixAchat || "0") +
    parseFloat(formData.fraisNotaire || "0") +
    parseFloat(formData.travauxInitiaux || "0") +
    parseFloat(formData.autresFrais || "0")

  const totalInvestissementsSecondaires = investissementsSecondaires.reduce(
    (sum, inv) => sum + (inv.montant || 0),
    0
  )

  const totalInvesti = investissementInitial + totalInvestissementsSecondaires

  // Charger investissements secondaires
  useEffect(() => {
    const fetchSecondaires = async () => {
      try {
        setLoadingSecondaires(true)
        const data = await getInvestissementsSecondaires(bien.id)
        setInvestissementsSecondaires(data || [])
      } catch (error: any) {
        console.error("Erreur chargement investissements secondaires:", error?.message || error)
        // Si la table n'existe pas, on continue silencieusement avec un tableau vide
        setInvestissementsSecondaires([])
      } finally {
        setLoadingSecondaires(false)
      }
    }
    fetchSecondaires()
  }, [bien.id])

  // Estimation frais de notaire (7.5%)
  const estimerFraisNotaire = () => {
    const estimation = parseFloat(formData.prixAchat || "0") * 0.075
    setFormData({ ...formData, fraisNotaire: estimation.toFixed(2) })
    toast.success(`Frais de notaire estimés : ${formatCurrency(estimation)}`)
  }

  // Sauvegarder investissement initial
  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prixAchat: parseFloat(formData.prixAchat || "0"),
          fraisNotaire: parseFloat(formData.fraisNotaire || "0"),
          travauxInitiaux: parseFloat(formData.travauxInitiaux || "0"),
          autresFrais: parseFloat(formData.autresFrais || "0"),
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde")

      toast.success("Investissement initial mis à jour")
      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur sauvegarde investissement:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      prixAchat: bien.prixAchat?.toString() || "0",
      fraisNotaire: bien.fraisNotaire?.toString() || "0",
      travauxInitiaux: bien.travauxInitiaux?.toString() || "0",
      autresFrais: bien.autresFrais?.toString() || "0",
    })
    setEditing(false)
  }

  // Ajouter investissement secondaire
  const handleAddSecondaire = async () => {
    if (!formSecondaire.description || !formSecondaire.montant) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    try {
      const newInv = await createInvestissementSecondaire(bien.id, {
        date: formSecondaire.date,
        description: formSecondaire.description,
        montant: parseFloat(formSecondaire.montant),
      })

      setInvestissementsSecondaires([newInv, ...investissementsSecondaires])
      setFormSecondaire({
        date: new Date().toISOString().split("T")[0],
        description: "",
        montant: "",
      })
      toast.success("Investissement ajouté")
    } catch (error) {
      console.error("Erreur ajout investissement secondaire:", error)
      toast.error("Erreur lors de l'ajout")
    }
  }

  // Supprimer investissement secondaire
  const handleDeleteSecondaire = async (id: string) => {
    if (!window.confirm("Supprimer cet investissement ?")) return

    try {
      await deleteInvestissementSecondaire(id)
      setInvestissementsSecondaires(investissementsSecondaires.filter((inv) => inv.id !== id))
      toast.success("Investissement supprimé")
    } catch (error) {
      console.error("Erreur suppression investissement secondaire:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      {/* Résumé : 3 KPICard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={Home}
          label="Investissement initial"
          value={formatCurrency(investissementInitial)}
          subtext="Achat + frais + travaux"
          variant="amber"
          delay={0}
        />

        <KPICard
          icon={PlusCircle}
          label="Investissements secondaires"
          value={formatCurrency(totalInvestissementsSecondaires)}
          subtext={`${investissementsSecondaires.length} investissement${investissementsSecondaires.length > 1 ? "s" : ""}`}
          variant="orange"
          delay={100}
        />

        <KPICard
          icon={DollarSign}
          label="Total investi"
          value={formatCurrency(totalInvesti)}
          subtext="Investissement global"
          variant="emerald"
          delay={200}
        />
      </div>

      {/* Section 1 : Investissement initial */}
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200">Investissement initial</CardTitle>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prix d'achat */}
            <div>
              <Label htmlFor="prixAchat" className="text-slate-300">
                Prix d&apos;achat (€)
              </Label>
              <Input
                id="prixAchat"
                type="number"
                step="0.01"
                value={formData.prixAchat}
                onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                disabled={!editing}
                className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-60"
              />
            </div>

            {/* Frais de notaire */}
            <div>
              <Label htmlFor="fraisNotaire" className="text-slate-300">
                Frais de notaire (€)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="fraisNotaire"
                  type="number"
                  step="0.01"
                  value={formData.fraisNotaire}
                  onChange={(e) => setFormData({ ...formData, fraisNotaire: e.target.value })}
                  disabled={!editing}
                  className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-60"
                />
                {editing && (
                  <Button
                    type="button"
                    onClick={estimerFraisNotaire}
                    variant="outline"
                    size="sm"
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 shrink-0"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editing && (
                <p className="text-xs text-slate-400 mt-1">Estimation : 7,5% du prix d&apos;achat</p>
              )}
            </div>

            {/* Travaux initiaux */}
            <div>
              <Label htmlFor="travauxInitiaux" className="text-slate-300">
                Travaux initiaux (€)
              </Label>
              <Input
                id="travauxInitiaux"
                type="number"
                step="0.01"
                value={formData.travauxInitiaux}
                onChange={(e) => setFormData({ ...formData, travauxInitiaux: e.target.value })}
                disabled={!editing}
                className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-60"
              />
            </div>

            {/* Autres frais */}
            <div>
              <Label htmlFor="autresFrais" className="text-slate-300">
                Autres frais (€)
              </Label>
              <Input
                id="autresFrais"
                type="number"
                step="0.01"
                value={formData.autresFrais}
                onChange={(e) => setFormData({ ...formData, autresFrais: e.target.value })}
                disabled={!editing}
                className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Total en temps réel */}
          {editing && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Investissement initial</span>
                <span className="text-2xl font-bold text-amber-400">
                  {formatCurrency(investissementInitial)}
                </span>
              </div>
            </div>
          )}

          {/* Boutons édition */}
          {editing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 : Investissements secondaires */}
      <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-200">Investissements secondaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire ajout */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Ajouter un investissement</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="dateSecondaire" className="text-slate-300 text-xs">
                  Date
                </Label>
                <Input
                  id="dateSecondaire"
                  type="date"
                  value={formSecondaire.date}
                  onChange={(e) => setFormSecondaire({ ...formSecondaire, date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <Label htmlFor="descriptionSecondaire" className="text-slate-300 text-xs">
                  Description
                </Label>
                <Input
                  id="descriptionSecondaire"
                  type="text"
                  placeholder="Ex: Nouveaux meubles"
                  value={formSecondaire.description}
                  onChange={(e) => setFormSecondaire({ ...formSecondaire, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <Label htmlFor="montantSecondaire" className="text-slate-300 text-xs">
                  Montant (€)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="montantSecondaire"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formSecondaire.montant}
                    onChange={(e) => setFormSecondaire({ ...formSecondaire, montant: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                  />
                  <Button
                    onClick={handleAddSecondaire}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-500 text-white shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste */}
          {loadingSecondaires ? (
            <div className="text-center py-8 text-slate-400">Chargement...</div>
          ) : investissementsSecondaires.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Aucun investissement secondaire pour le moment
            </div>
          ) : (
            <div className="space-y-2">
              {investissementsSecondaires.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{inv.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(inv.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-orange-400">
                      {formatCurrency(inv.montant)}
                    </span>
                    <Button
                      onClick={() => handleDeleteSecondaire(inv.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
