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
import { cn } from "@/lib/utils"

interface ChargesProps {
  bien: any
}

export function Charges({ bien }: ChargesProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [affichage, setAffichage] = useState<"mensuel" | "annuel">("mensuel")

  // États du formulaire (toujours stocké en mensuel)
  const [formData, setFormData] = useState({
    taxeFonciere: bien.taxeFonciere?.toString() || "0",
    chargesCopro: bien.chargesCopro?.toString() || "0",
    assurance: bien.assurance?.toString() || "0",
    fraisGestion: bien.fraisGestion?.toString() || "0",
    autresCharges: bien.autresCharges?.toString() || "0",
  })

  const multiplicateur = affichage === "annuel" ? 12 : 1

  // Calcul du total (formulaire en temps réel ou bien actuel)
  const totalChargesForm =
    parseFloat(formData.taxeFonciere || "0") +
    parseFloat(formData.chargesCopro || "0") +
    parseFloat(formData.assurance || "0") +
    parseFloat(formData.fraisGestion || "0") +
    parseFloat(formData.autresCharges || "0")

  const totalChargesBien = calculateChargesMensuelles(bien)
  const totalChargesMensuel = editing ? totalChargesForm : totalChargesBien
  const totalChargesAffiche = totalChargesMensuel * multiplicateur

  // Valeurs individuelles pour les KPICard
  const taxeFonciere = (editing ? parseFloat(formData.taxeFonciere || "0") : (bien.taxeFonciere || 0)) * multiplicateur
  const chargesCopro = (editing ? parseFloat(formData.chargesCopro || "0") : (bien.chargesCopro || 0)) * multiplicateur
  const assurance = (editing ? parseFloat(formData.assurance || "0") : (bien.assurance || 0)) * multiplicateur
  const fraisGestion = (editing ? parseFloat(formData.fraisGestion || "0") : (bien.fraisGestion || 0)) * multiplicateur
  const autresCharges = (editing ? parseFloat(formData.autresCharges || "0") : (bien.autresCharges || 0)) * multiplicateur

  const labelPeriode = affichage === "mensuel" ? "Par mois" : "Par an"
  const labelUnite = affichage === "mensuel" ? "€/mois" : "€/an"

  // Lecture de la valeur d'un champ pour l'input (affichage annuel = ×12)
  const getInputValue = (fieldMensuel: string) => {
    const mensuel = parseFloat(fieldMensuel || "0")
    if (affichage === "annuel") {
      const annuel = mensuel * 12
      // Éviter les décimales parasites (ex: 0.833... * 12 = 9.999...)
      return parseFloat(annuel.toFixed(2)).toString()
    }
    return fieldMensuel
  }

  // Écriture d'une valeur d'input (reconvertir en mensuel si annuel)
  const setInputValue = (field: keyof typeof formData, value: string) => {
    const mensuel = affichage === "annuel"
      ? (parseFloat(value || "0") / 12).toString()
      : value
    setFormData({ ...formData, [field]: mensuel })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // La sauvegarde est TOUJOURS en mensuel (formData est en mensuel)
      const response = await fetch(`/api/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxeFonciere: parseFloat(formData.taxeFonciere || "0"),
          chargesCopro: parseFloat(formData.chargesCopro || "0"),
          assurance: parseFloat(formData.assurance || "0"),
          fraisGestion: parseFloat(formData.fraisGestion || "0"),
          autresCharges: parseFloat(formData.autresCharges || "0"),
          chargesMensuelles: totalChargesMensuel,
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

  // Composant toggle réutilisé en lecture et édition
  const ToggleAffichage = () => (
    <div className="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-800/50">
      <button
        type="button"
        onClick={() => setAffichage("mensuel")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
          affichage === "mensuel"
            ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
            : "text-slate-400 hover:text-slate-300"
        )}
      >
        Par mois
      </button>
      <button
        type="button"
        onClick={() => setAffichage("annuel")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
          affichage === "annuel"
            ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
            : "text-slate-400 hover:text-slate-300"
        )}
      >
        Par an
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Total des charges (grand KPI) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            Total des charges {affichage === "mensuel" ? "mensuelles" : "annuelles"}
          </h3>
          <ToggleAffichage />
        </div>

        <KPICard
          icon={Calculator}
          label={`Charges ${affichage === "mensuel" ? "mensuelles" : "annuelles"} totales`}
          value={formatCurrency(totalChargesAffiche)}
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
              <KPICard
                icon={Landmark}
                label="Taxe foncière"
                value={formatCurrency(taxeFonciere)}
                subtext={labelPeriode}
                variant="red"
                size="sm"
                delay={0}
              />

              <KPICard
                icon={Building2}
                label="Charges copro"
                value={formatCurrency(chargesCopro)}
                subtext={labelPeriode}
                variant="orange"
                size="sm"
                delay={100}
              />

              <KPICard
                icon={Shield}
                label="Assurance"
                value={formatCurrency(assurance)}
                subtext={labelPeriode}
                variant="sky"
                size="sm"
                delay={200}
              />

              <KPICard
                icon={Briefcase}
                label="Frais de gestion"
                value={formatCurrency(fraisGestion)}
                subtext={labelPeriode}
                variant="purple"
                size="sm"
                delay={300}
              />

              <KPICard
                icon={Receipt}
                label="Autres charges"
                value={formatCurrency(autresCharges)}
                subtext={labelPeriode}
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-200">
                Modifier les charges {affichage === "mensuel" ? "mensuelles" : "annuelles"}
              </CardTitle>
              <ToggleAffichage />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Taxe foncière */}
              <div>
                <Label htmlFor="taxeFonciere" className="text-slate-300">
                  Taxe foncière ({labelUnite})
                </Label>
                <Input
                  id="taxeFonciere"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.taxeFonciere)}
                  onChange={(e) => setInputValue("taxeFonciere", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Charges copro */}
              <div>
                <Label htmlFor="chargesCopro" className="text-slate-300">
                  Charges copro ({labelUnite})
                </Label>
                <Input
                  id="chargesCopro"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.chargesCopro)}
                  onChange={(e) => setInputValue("chargesCopro", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Assurance */}
              <div>
                <Label htmlFor="assurance" className="text-slate-300">
                  Assurance ({labelUnite})
                </Label>
                <Input
                  id="assurance"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.assurance)}
                  onChange={(e) => setInputValue("assurance", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Frais de gestion */}
              <div>
                <Label htmlFor="fraisGestion" className="text-slate-300">
                  Frais de gestion ({labelUnite})
                </Label>
                <Input
                  id="fraisGestion"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.fraisGestion)}
                  onChange={(e) => setInputValue("fraisGestion", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Autres charges */}
              <div className="md:col-span-2">
                <Label htmlFor="autresCharges" className="text-slate-300">
                  Autres charges ({labelUnite})
                </Label>
                <Input
                  id="autresCharges"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.autresCharges)}
                  onChange={(e) => setInputValue("autresCharges", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            </div>

            {/* Total en temps réel */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">
                  Total des charges {affichage === "mensuel" ? "mensuelles" : "annuelles"}
                </span>
                <span className="text-3xl font-bold text-amber-400">
                  {formatCurrency(totalChargesAffiche)}
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
