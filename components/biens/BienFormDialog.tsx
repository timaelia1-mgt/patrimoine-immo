"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { createBien } from "@/lib/database"

interface BienFormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function BienFormDialog({ open, onOpenChange, onSuccess }: BienFormDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    ville: "",
    codePostal: "",
    loyerMensuel: "",
    taxeFonciere: "",
    chargesCopro: "",
    assurance: "",
    fraisGestion: "",
    autresCharges: "",
    typeFinancement: "CREDIT",
    dateDebutCredit: "",
    montantCredit: "",
    tauxCredit: "",
    dureeCredit: "",
  })

  // Fonction de calcul de mensualité (amortissement français)
  const calculateMensualite = (montant: number, tauxAnnuel: number, dureeMois: number): number => {
    if (!montant || !tauxAnnuel || !dureeMois || montant <= 0 || dureeMois <= 0) return 0
    
    const tauxMensuel = tauxAnnuel / 100 / 12
    
    if (tauxMensuel === 0) {
      return montant / dureeMois
    }
    
    const mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois))
    return Math.round(mensualite * 100) / 100
  }

  // Calculer la mensualité automatiquement
  const mensualiteCalculee = formData.typeFinancement === "CREDIT" && 
    formData.montantCredit && 
    formData.tauxCredit && 
    formData.dureeCredit
    ? calculateMensualite(
        parseFloat(formData.montantCredit),
        parseFloat(formData.tauxCredit),
        parseInt(formData.dureeCredit)
      )
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("Vous devez être connecté pour ajouter un bien")
      return
    }

    // Validation des champs obligatoires de base
    if (!formData.nom.trim()) {
      alert("Le nom du bien est obligatoire")
      return
    }
    if (!formData.adresse.trim()) {
      alert("L'adresse est obligatoire")
      return
    }
    if (!formData.ville.trim()) {
      alert("La ville est obligatoire")
      return
    }
    if (!formData.codePostal.trim()) {
      alert("Le code postal est obligatoire")
      return
    }
    if (!formData.loyerMensuel || parseFloat(formData.loyerMensuel) <= 0) {
      alert("Le loyer mensuel est obligatoire et doit être supérieur à 0")
      return
    }

    // Validation des champs de crédit si typeFinancement === "CREDIT"
    if (formData.typeFinancement === "CREDIT") {
      if (!formData.montantCredit || parseFloat(formData.montantCredit) <= 0) {
        alert("Le montant emprunté est obligatoire pour un bien financé par crédit")
        return
      }
      if (!formData.tauxCredit || parseFloat(formData.tauxCredit) <= 0) {
        alert("Le taux d'intérêt est obligatoire pour un bien financé par crédit")
        return
      }
      if (!formData.dureeCredit || parseInt(formData.dureeCredit) <= 0) {
        alert("La durée du crédit est obligatoire pour un bien financé par crédit")
        return
      }
    }

    setLoading(true)

    const data: any = {
      nom: formData.nom.trim(),
      adresse: formData.adresse.trim(),
      ville: formData.ville.trim(),
      codePostal: formData.codePostal.trim(),
      loyerMensuel: parseFloat(formData.loyerMensuel),
      typeFinancement: formData.typeFinancement,
      taxeFonciere: formData.taxeFonciere ? parseFloat(formData.taxeFonciere) : 0,
      chargesCopro: formData.chargesCopro ? parseFloat(formData.chargesCopro) : 0,
      assurance: formData.assurance ? parseFloat(formData.assurance) : 0,
      fraisGestion: formData.fraisGestion ? parseFloat(formData.fraisGestion) : 0,
      autresCharges: formData.autresCharges ? parseFloat(formData.autresCharges) : 0,
      chargesMensuelles: 0,
    }

    if (formData.typeFinancement === "CREDIT") {
      // Calculer la mensualité automatiquement
      const mensualiteCalculee = calculateMensualite(
        parseFloat(formData.montantCredit),
        parseFloat(formData.tauxCredit),
        parseInt(formData.dureeCredit)
      )
      
      data.mensualiteCredit = mensualiteCalculee
      data.montantCredit = parseFloat(formData.montantCredit)
      data.tauxCredit = parseFloat(formData.tauxCredit)
      data.dureeCredit = parseInt(formData.dureeCredit)
      data.dateDebutCredit = formData.dateDebutCredit ? formData.dateDebutCredit : null
    }

    try {
      await createBien(user.id, data)
      
      setFormData({
        nom: "",
        adresse: "",
        ville: "",
        codePostal: "",
        loyerMensuel: "",
        taxeFonciere: "",
        chargesCopro: "",
        assurance: "",
        fraisGestion: "",
        autresCharges: "",
        typeFinancement: "CREDIT",
        dateDebutCredit: "",
        montantCredit: "",
        tauxCredit: "",
        dureeCredit: "",
      })
      onOpenChange?.(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'ajout du bien")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Ajouter un bien immobilier</DialogTitle>
          <DialogDescription>
            Remplissez les informations de base. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-2 space-y-6 py-1">
          {/* Section 1: Informations de base */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Informations de base
              </h3>
            </div>

            <div>
              <Label htmlFor="nom" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Nom du bien *
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Appartement Paris 15e"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="adresse" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Adresse *
                </Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Ex: 12 rue de la Paix"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="codePostal" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Code postal *
                </Label>
                <Input
                  id="codePostal"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                  placeholder="75015"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ville" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Ville *
              </Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Ex: Paris"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Section 2: Loyers et charges */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Loyers et charges
              </h3>
            </div>

            <div>
              <Label htmlFor="loyerMensuel" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Loyer mensuel (€) *
              </Label>
              <Input
                id="loyerMensuel"
                type="number"
                step="0.01"
                min="0"
                value={formData.loyerMensuel}
                onChange={(e) => setFormData({ ...formData, loyerMensuel: e.target.value })}
                placeholder="Ex: 900"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Charges mensuelles (optionnel)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peut être complété plus tard</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxeFonciere" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Taxe foncière (€/mois)
                  </Label>
                  <Input
                    id="taxeFonciere"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.taxeFonciere || ""}
                    onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                    placeholder="Ex: 150"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="chargesCopro" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Charges copro (€/mois)
                  </Label>
                  <Input
                    id="chargesCopro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.chargesCopro || ""}
                    onChange={(e) => setFormData({ ...formData, chargesCopro: e.target.value })}
                    placeholder="Ex: 200"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="assurance" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Assurance PNO (€/mois)
                  </Label>
                  <Input
                    id="assurance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.assurance || ""}
                    onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                    placeholder="Ex: 30"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="fraisGestion" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Frais de gestion (€/mois)
                  </Label>
                  <Input
                    id="fraisGestion"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fraisGestion || ""}
                    onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                    placeholder="Ex: 80"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="autresCharges" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Autres charges (€/mois)
                </Label>
                <Input
                  id="autresCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.autresCharges || ""}
                  onChange={(e) => setFormData({ ...formData, autresCharges: e.target.value })}
                  placeholder="Ex: 50"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financement */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Financement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peut être complété plus tard</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="typeFinancement" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Type de financement
              </Label>
              <select
                id="typeFinancement"
                value={formData.typeFinancement}
                onChange={(e) => setFormData({ ...formData, typeFinancement: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
                disabled={loading}
              >
                <option value="CREDIT">Crédit</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {formData.typeFinancement === "CREDIT" && (
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateDebutCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Date de début du crédit
                    </Label>
                    <Input
                      id="dateDebutCredit"
                      type="date"
                      value={formData.dateDebutCredit}
                      onChange={(e) => setFormData({ ...formData, dateDebutCredit: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dureeCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Durée (mois) *
                    </Label>
                    <Input
                      id="dureeCredit"
                      type="number"
                      min="1"
                      value={formData.dureeCredit}
                      onChange={(e) => setFormData({ ...formData, dureeCredit: e.target.value })}
                      placeholder="Ex: 240"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montantCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Montant emprunté (€) *
                    </Label>
                    <Input
                      id="montantCredit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.montantCredit}
                      onChange={(e) => setFormData({ ...formData, montantCredit: e.target.value })}
                      placeholder="Ex: 200000"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tauxCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Taux d'intérêt (%) *
                    </Label>
                    <Input
                      id="tauxCredit"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tauxCredit}
                      onChange={(e) => setFormData({ ...formData, tauxCredit: e.target.value })}
                      placeholder="Ex: 3.5"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Affichage mensualité calculée */}
                {mensualiteCalculee !== null && mensualiteCalculee > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-1">
                      Mensualité calculée automatiquement
                    </p>
                    <p className="text-xl font-semibold text-emerald-400">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(mensualiteCalculee)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      Calculée à partir du montant, du taux et de la durée
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter le bien"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
