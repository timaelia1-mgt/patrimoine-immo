"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { createBien, createLot, updateBien, type Bien } from "@/lib/database"
import { calculateMensualiteCredit, formatCurrency } from "@/lib/calculations"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"

interface BienFormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  bien?: Bien
}

export function BienFormDialog({ open, onOpenChange, onSuccess, bien }: BienFormDialogProps) {
  const isEditMode = !!bien
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modeCharges, setModeCharges] = useState<'mensuel' | 'annuel'>('mensuel')
  const [multipleLots, setMultipleLots] = useState(false)
  const [lots, setLots] = useState<Array<{
    id: string
    numeroLot: string
    loyerMensuel: string
  }>>([
    { id: crypto.randomUUID(), numeroLot: "Lot 1", loyerMensuel: "" }
  ])
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

  // Pré-remplir en mode édition OU réinitialiser quand le dialog se ferme
  useEffect(() => {
    if (open && isEditMode && bien) {
      setFormData({
        nom: bien.nom || "",
        adresse: bien.adresse || "",
        ville: bien.ville || "",
        codePostal: bien.codePostal || "",
        loyerMensuel: bien.loyerMensuel ? bien.loyerMensuel.toString() : "",
        taxeFonciere: bien.taxeFonciere ? bien.taxeFonciere.toString() : "",
        chargesCopro: bien.chargesCopro ? bien.chargesCopro.toString() : "",
        assurance: bien.assurance ? bien.assurance.toString() : "",
        fraisGestion: bien.fraisGestion ? bien.fraisGestion.toString() : "",
        autresCharges: bien.autresCharges ? bien.autresCharges.toString() : "",
        typeFinancement: bien.typeFinancement || "CREDIT",
        dateDebutCredit: bien.dateDebutCredit || "",
        montantCredit: bien.montantCredit ? bien.montantCredit.toString() : "",
        tauxCredit: bien.tauxCredit ? bien.tauxCredit.toString() : "",
        dureeCredit: bien.dureeCredit ? bien.dureeCredit.toString() : "",
      })
      setModeCharges('mensuel')
      setMultipleLots(false)
    } else if (!open) {
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
      setModeCharges('mensuel')
      setMultipleLots(false)
      setLots([{ id: crypto.randomUUID(), numeroLot: "Lot 1", loyerMensuel: "" }])
    }
  }, [open, isEditMode, bien])

  // Calculer la mensualité automatiquement
  const mensualiteCalculee = formData.typeFinancement === "CREDIT" && 
    formData.montantCredit && 
    formData.tauxCredit && 
    formData.dureeCredit
    ? calculateMensualiteCredit(
        parseFloat(formData.montantCredit),
        parseFloat(formData.tauxCredit),
        parseInt(formData.dureeCredit)
      )
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Protection double-submit
    if (isSubmitting) {
      return
    }

    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un bien")
      return
    }

    // Validation des champs obligatoires de base
    if (!formData.nom.trim()) {
      toast.error("Le nom du bien est obligatoire")
      return
    }
    if (!formData.adresse.trim()) {
      toast.error("L'adresse est obligatoire")
      return
    }
    if (!formData.ville.trim()) {
      toast.error("La ville est obligatoire")
      return
    }
    if (!formData.codePostal.trim()) {
      toast.error("Le code postal est obligatoire")
      return
    }
    if (!multipleLots) {
      if (!formData.loyerMensuel || parseFloat(formData.loyerMensuel) <= 0) {
        toast.error("Le loyer mensuel est obligatoire et doit être supérieur à 0")
        return
      }
    } else {
      // Valider que chaque lot a un loyer
      for (const lot of lots) {
        if (!lot.loyerMensuel || parseFloat(lot.loyerMensuel) <= 0) {
          toast.error(`Le loyer du lot "${lot.numeroLot}" est obligatoire et doit être supérieur à 0`)
          return
        }
      }
      if (lots.length === 0) {
        toast.error("Vous devez créer au moins un lot")
        return
      }
    }

    // Validation des champs de crédit si typeFinancement === "CREDIT"
    if (formData.typeFinancement === "CREDIT") {
      if (!formData.montantCredit || parseFloat(formData.montantCredit) <= 0) {
        toast.error("Le montant emprunté est obligatoire pour un bien financé par crédit")
        return
      }
      if (!formData.tauxCredit || parseFloat(formData.tauxCredit) <= 0) {
        toast.error("Le taux d'intérêt est obligatoire pour un bien financé par crédit")
        return
      }
      if (!formData.dureeCredit || parseInt(formData.dureeCredit) <= 0) {
        toast.error("La durée du crédit est obligatoire pour un bien financé par crédit")
        return
      }
    }

    setIsSubmitting(true)
    setLoading(true)

    try {
      // Convertir en mensuel si l'utilisateur a saisi en annuel
      const diviseur = modeCharges === 'annuel' ? 12 : 1
      
      // Calculer le loyer total (somme des lots en mode multi, ou loyer direct en mode simple)
      const loyerTotal = multipleLots
        ? lots.reduce((sum, lot) => sum + parseFloat(lot.loyerMensuel || "0"), 0)
        : parseFloat(formData.loyerMensuel)

      const data: any = {
        nom: formData.nom.trim(),
        adresse: formData.adresse.trim(),
        ville: formData.ville.trim(),
        codePostal: formData.codePostal.trim(),
        loyerMensuel: loyerTotal,
        typeFinancement: formData.typeFinancement,
        taxeFonciere: formData.taxeFonciere ? parseFloat(formData.taxeFonciere) / diviseur : 0,
        chargesCopro: formData.chargesCopro ? parseFloat(formData.chargesCopro) / diviseur : 0,
        assurance: formData.assurance ? parseFloat(formData.assurance) / diviseur : 0,
        fraisGestion: formData.fraisGestion ? parseFloat(formData.fraisGestion) / diviseur : 0,
        autresCharges: formData.autresCharges ? parseFloat(formData.autresCharges) / diviseur : 0,
        chargesMensuelles: 0,
      }

      if (formData.typeFinancement === "CREDIT") {
        // Calculer la mensualité automatiquement
        const mensualiteCalculee = calculateMensualiteCredit(
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

      if (isEditMode && bien) {
        // MODE ÉDITION : mettre à jour le bien existant
        await updateBien(bien.id, data)
        
        toast.success("Bien modifié avec succès !")
        queryClient.invalidateQueries({ queryKey: ['biens'] })
        queryClient.invalidateQueries({ queryKey: ['bien', bien.id] })
        onSuccess?.()
      } else {
        // MODE CRÉATION : créer le bien + lots
        const nouveauBien = await createBien(user.id, data)

        // Créer les lots
        if (multipleLots && lots.length > 0) {
          for (let i = 0; i < lots.length; i++) {
            const lot = lots[i]
            await createLot({
              bienId: nouveauBien.id,
              numeroLot: lot.numeroLot,
              loyerMensuel: parseFloat(lot.loyerMensuel),
              estLotDefaut: i === 0,
            })
          }
        } else {
          await createLot({
            bienId: nouveauBien.id,
            numeroLot: "Principal",
            loyerMensuel: loyerTotal,
            estLotDefaut: true,
          })
        }
        
        // Reset du formulaire
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
        
        queryClient.invalidateQueries({ queryKey: ['biens'] })
        toast.success("Bien créé avec succès !")
        onSuccess?.()
      }
    } catch (error: unknown) {
      console.error('[BienForm] Erreur création bien/lots:', error)
      logger.error('[BienForm] Erreur création:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du bien"
      toast.error(errorMessage)
      
      // Si c'est une erreur de limite, fermer le dialog
      if (errorMessage.includes("Limite") || errorMessage.includes("limite")) {
        onOpenChange?.(false)
      }
    } finally {
      // CRITIQUE : Toujours réinitialiser l'état de chargement
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? "Modifier le bien" : "Ajouter un bien immobilier"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifiez les informations du bien. Les champs marqués d'un * sont obligatoires."
              : "Remplissez les informations de base. Les champs marqués d'un * sont obligatoires."}
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

            {/* Loyer mensuel (si mode simple) */}
            {!multipleLots && (
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
                  required={!multipleLots}
                  disabled={loading}
                />
              </div>
            )}

            {/* Checkbox plusieurs lots (uniquement en mode création) */}
            {!isEditMode && <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <input
                type="checkbox"
                id="multipleLots"
                checked={multipleLots}
                onChange={(e) => {
                  setMultipleLots(e.target.checked)
                  if (e.target.checked && lots.length === 0) {
                    setLots([
                      { id: crypto.randomUUID(), numeroLot: "Lot 1", loyerMensuel: "" }
                    ])
                  }
                }}
                className="w-4 h-4 rounded border-amber-500/50 bg-slate-800 text-amber-600 focus:ring-amber-500"
                disabled={loading}
              />
              <Label htmlFor="multipleLots" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                Ce bien possède plusieurs lots (appartements, studios, etc.)
              </Label>
            </div>}

            {/* Formulaire des lots (si mode multiple, uniquement en création) */}
            {!isEditMode && multipleLots && (
              <div className="space-y-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Lots du bien</Label>
                  <Button
                    type="button"
                    onClick={() => setLots([...lots, {
                      id: crypto.randomUUID(),
                      numeroLot: `Lot ${lots.length + 1}`,
                      loyerMensuel: ""
                    }])}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un lot
                  </Button>
                </div>

                {lots.map((lot, index) => (
                  <div key={lot.id} className="p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Lot {index + 1}</span>
                      {lots.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setLots(lots.filter((_, i) => i !== index))}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-500 dark:text-slate-400 text-xs">Nom du lot</Label>
                        <Input
                          value={lot.numeroLot}
                          onChange={(e) => {
                            const newLots = [...lots]
                            newLots[index].numeroLot = e.target.value
                            setLots(newLots)
                          }}
                          placeholder="ex: T2 RDC"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label className="text-slate-500 dark:text-slate-400 text-xs">
                          Loyer mensuel (€) <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={lot.loyerMensuel}
                          onChange={(e) => {
                            const newLots = [...lots]
                            newLots[index].loyerMensuel = e.target.value
                            setLots(newLots)
                          }}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loyer total calculé */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Loyer mensuel total du bien</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(lots.reduce((sum, lot) => sum + parseFloat(lot.loyerMensuel || "0"), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Charges (optionnel)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peut être complété plus tard</p>
              </div>

              {/* Toggle mensuel/annuel */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">Saisie :</span>
                <button
                  type="button"
                  onClick={() => setModeCharges('mensuel')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    modeCharges === 'mensuel'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Par mois
                </button>
                <button
                  type="button"
                  onClick={() => setModeCharges('annuel')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    modeCharges === 'annuel'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Par an
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxeFonciere" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Taxe foncière ({modeCharges === 'mensuel' ? '€/mois' : '€/an'})
                  </Label>
                  <Input
                    id="taxeFonciere"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.taxeFonciere || ""}
                    onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 150' : 'Ex: 1800'}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="chargesCopro" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Charges copro ({modeCharges === 'mensuel' ? '€/mois' : '€/an'})
                  </Label>
                  <Input
                    id="chargesCopro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.chargesCopro || ""}
                    onChange={(e) => setFormData({ ...formData, chargesCopro: e.target.value })}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 200' : 'Ex: 2400'}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="assurance" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Assurance PNO ({modeCharges === 'mensuel' ? '€/mois' : '€/an'})
                  </Label>
                  <Input
                    id="assurance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.assurance || ""}
                    onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 30' : 'Ex: 360'}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="fraisGestion" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                    Frais de gestion ({modeCharges === 'mensuel' ? '€/mois' : '€/an'})
                  </Label>
                  <Input
                    id="fraisGestion"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fraisGestion || ""}
                    onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 80' : 'Ex: 960'}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="autresCharges" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Autres charges ({modeCharges === 'mensuel' ? '€/mois' : '€/an'})
                </Label>
                <Input
                  id="autresCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.autresCharges || ""}
                  onChange={(e) => setFormData({ ...formData, autresCharges: e.target.value })}
                  placeholder={modeCharges === 'mensuel' ? 'Ex: 50' : 'Ex: 600'}
                  disabled={loading}
                />
              </div>

              {modeCharges === 'annuel' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  💡 Les montants annuels seront automatiquement convertis en mensuel pour le stockage.
                </p>
              )}
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
            <Button type="submit" disabled={loading || isSubmitting}>
              {loading
                ? (isEditMode ? "Modification en cours..." : "Ajout en cours...")
                : (isEditMode ? "Enregistrer les modifications" : "Ajouter le bien")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
