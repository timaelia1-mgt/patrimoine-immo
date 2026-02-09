"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, Landmark, Building2, Shield, Briefcase, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency, calculateChargesMensuelles } from "@/lib/calculations"
import { toast } from "sonner"

interface ChargesProps {
  bien: any
}

export function Charges({ bien }: ChargesProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // États du formulaire
  const [formData, setFormData] = useState({
    taxeFonciere: bien.taxeFonciere?.toString() || "0",
    chargesCopro: bien.chargesCopro?.toString() || "0",
    assurance: bien.assurance?.toString() || "0",
    fraisGestion: bien.fraisGestion?.toString() || "0",
    autresCharges: bien.autresCharges?.toString() || "0",
  })

  // Calcul du total (formulaire en temps réel ou bien actuel)
  const totalChargesForm =
    parseFloat(formData.taxeFonciere || "0") +
    parseFloat(formData.chargesCopro || "0") +
    parseFloat(formData.assurance || "0") +
    parseFloat(formData.fraisGestion || "0") +
    parseFloat(formData.autresCharges || "0")

  const totalChargesBien = calculateChargesMensuelles(bien)
  const totalCharges = editing ? totalChargesForm : totalChargesBien

  // Valeurs individuelles pour les KPICard
  const taxeFonciere = editing ? parseFloat(formData.taxeFonciere || "0") : (bien.taxeFonciere || 0)
  const chargesCopro = editing ? parseFloat(formData.chargesCopro || "0") : (bien.chargesCopro || 0)
  const assurance = editing ? parseFloat(formData.assurance || "0") : (bien.assurance || 0)
  const fraisGestion = editing ? parseFloat(formData.fraisGestion || "0") : (bien.fraisGestion || 0)
  const autresCharges = editing ? parseFloat(formData.autresCharges || "0") : (bien.autresCharges || 0)

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxeFonciere: parseFloat(formData.taxeFonciere || "0"),
          chargesCopro: parseFloat(formData.chargesCopro || "0"),
          assurance: parseFloat(formData.assurance || "0"),
          fraisGestion: parseFloat(formData.fraisGestion || "0"),
          autresCharges: parseFloat(formData.autresCharges || "0"),
          chargesMensuelles: totalCharges,
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde")

      toast.success("Charges mises à jour avec succès")
      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur sauvegarde charges:", error)
      toast.error("Erreur lors de la sauvegarde des charges")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      taxeFonciere: bien.taxeFonciere?.toString() || "0",
      chargesCopro: bien.chargesCopro?.toString() || "0",
      assurance: bien.assurance?.toString() || "0",
      fraisGestion: bien.fraisGestion?.toString() || "0",
      autresCharges: bien.autresCharges?.toString() || "0",
    })
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Total des charges mensuel (grand KPI) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-500" />
          Total des charges mensuelles
        </h3>

        <KPICard
          icon={Calculator}
          label="Charges mensuelles totales"
          value={formatCurrency(totalCharges)}
          subtext="Toutes charges confondues"
          variant="amber"
          size="lg"
        />
      </div>

      {/* Mode lecture : Grille de 5 mini KPICard */}
      {!editing && (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Détail des charges</h3>
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                Modifier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Taxe foncière */}
              <KPICard
                icon={Landmark}
                label="Taxe foncière"
                value={formatCurrency(taxeFonciere)}
                subtext="Par mois"
                variant="red"
                size="sm"
                delay={0}
              />

              {/* Charges copro */}
              <KPICard
                icon={Building2}
                label="Charges copro"
                value={formatCurrency(chargesCopro)}
                subtext="Par mois"
                variant="orange"
                size="sm"
                delay={100}
              />

              {/* Assurance */}
              <KPICard
                icon={Shield}
                label="Assurance"
                value={formatCurrency(assurance)}
                subtext="Par mois"
                variant="sky"
                size="sm"
                delay={200}
              />

              {/* Frais de gestion */}
              <KPICard
                icon={Briefcase}
                label="Frais de gestion"
                value={formatCurrency(fraisGestion)}
                subtext="Par mois"
                variant="purple"
                size="sm"
                delay={300}
              />

              {/* Autres charges */}
              <KPICard
                icon={Receipt}
                label="Autres charges"
                value={formatCurrency(autresCharges)}
                subtext="Par mois"
                variant="slate"
                size="sm"
                delay={400}
              />
            </div>
          </div>
        </>
      )}

      {/* Mode édition : Formulaire */}
      {editing && (
        <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-200">Modifier les charges mensuelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Taxe foncière */}
              <div>
                <Label htmlFor="taxeFonciere" className="text-slate-300">
                  Taxe foncière (€/mois)
                </Label>
                <Input
                  id="taxeFonciere"
                  type="number"
                  step="0.01"
                  value={formData.taxeFonciere}
                  onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Charges copro */}
              <div>
                <Label htmlFor="chargesCopro" className="text-slate-300">
                  Charges copro (€/mois)
                </Label>
                <Input
                  id="chargesCopro"
                  type="number"
                  step="0.01"
                  value={formData.chargesCopro}
                  onChange={(e) => setFormData({ ...formData, chargesCopro: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Assurance */}
              <div>
                <Label htmlFor="assurance" className="text-slate-300">
                  Assurance (€/mois)
                </Label>
                <Input
                  id="assurance"
                  type="number"
                  step="0.01"
                  value={formData.assurance}
                  onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Frais de gestion */}
              <div>
                <Label htmlFor="fraisGestion" className="text-slate-300">
                  Frais de gestion (€/mois)
                </Label>
                <Input
                  id="fraisGestion"
                  type="number"
                  step="0.01"
                  value={formData.fraisGestion}
                  onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Autres charges */}
              <div className="md:col-span-2">
                <Label htmlFor="autresCharges" className="text-slate-300">
                  Autres charges (€/mois)
                </Label>
                <Input
                  id="autresCharges"
                  type="number"
                  step="0.01"
                  value={formData.autresCharges}
                  onChange={(e) => setFormData({ ...formData, autresCharges: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            </div>

            {/* Total en temps réel */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Total des charges mensuelles</span>
                <span className="text-3xl font-bold text-amber-400">
                  {formatCurrency(totalCharges)}
                </span>
              </div>
            </div>

            {/* Boutons */}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
