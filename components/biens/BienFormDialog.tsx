"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Plus, Trash2, Loader2 } from "lucide-react"
import { BienFormSchema, type BienFormInput } from "@/lib/schemas"

interface BienFormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  bien?: Bien
}

/** Inline error message under form fields with ARIA + animation */
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium animate-in fade-in slide-in-from-top-1 duration-200"
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  )
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

  // ── react-hook-form + Zod ──────────────────────────────────
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
    setFocus,
  } = useForm({
    resolver: zodResolver(BienFormSchema),
    mode: "onTouched",
    defaultValues: {
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
      typeFinancement: "CREDIT" as "CREDIT" | "CASH",
      montantCredit: "",
      tauxCredit: "",
      dureeCredit: "",
      dateDebutCredit: "",
    },
  })

  // Watch typeFinancement for conditional credit fields
  const typeFinancement = watch("typeFinancement")
  const watchedMontant = watch("montantCredit")
  const watchedTaux = watch("tauxCredit")
  const watchedDuree = watch("dureeCredit")

  // ── Pré-remplir en mode édition / réinitialiser ──────────
  useEffect(() => {
    if (open && isEditMode && bien) {
      const normalizedFt: "CREDIT" | "CASH" =
        bien.typeFinancement === "CREDIT" ? "CREDIT" : "CASH"

      reset({
        nom: bien.nom || "",
        adresse: bien.adresse || "",
        ville: bien.ville || "",
        codePostal: bien.codePostal || "",
        loyerMensuel: bien.loyerMensuel ? String(bien.loyerMensuel) : "",
        taxeFonciere: bien.taxeFonciere ? String(bien.taxeFonciere) : "",
        chargesCopro: bien.chargesCopro ? String(bien.chargesCopro) : "",
        assurance: bien.assurance ? String(bien.assurance) : "",
        fraisGestion: bien.fraisGestion ? String(bien.fraisGestion) : "",
        autresCharges: bien.autresCharges ? String(bien.autresCharges) : "",
        typeFinancement: normalizedFt,
        montantCredit: bien.montantCredit ? String(bien.montantCredit) : "",
        tauxCredit: bien.tauxCredit ? String(bien.tauxCredit) : "",
        dureeCredit: bien.dureeCredit ? String(bien.dureeCredit) : "",
        dateDebutCredit: bien.dateDebutCredit || "",
      })
      setModeCharges('mensuel')
      setMultipleLots(false)
    } else if (!open) {
      reset()
      setModeCharges('mensuel')
      setMultipleLots(false)
      setLots([{ id: crypto.randomUUID(), numeroLot: "Lot 1", loyerMensuel: "" }])
    }
  }, [open, isEditMode, bien, reset])

  // ── Sync lots total → loyerMensuel quand multipleLots ────
  useEffect(() => {
    if (multipleLots) {
      const total = lots.reduce((sum, lot) => sum + (parseFloat(lot.loyerMensuel) || 0), 0)
      // Set loyerMensuel to lots total (or "1" to pass positive() validation when lots are empty)
      setValue("loyerMensuel", total > 0 ? String(total) : "1", { shouldValidate: false })
    }
  }, [multipleLots, lots, setValue])

  // ── Calcul mensualité automatique ─────────────────────────
  const mensualiteCalculee =
    typeFinancement === "CREDIT" && watchedMontant && watchedTaux && watchedDuree
      ? calculateMensualiteCredit(
          Number(watchedMontant),
          Number(watchedTaux),
          Number(watchedDuree)
        )
      : null

  // ── Auto-focus first invalid field on submit ─────────────
  useEffect(() => {
    const firstError = Object.keys(errors)[0] as keyof BienFormInput | undefined
    if (firstError) {
      try { setFocus(firstError) } catch { /* field may not be mounted (e.g. credit fields hidden) */ }
    }
  }, [errors, setFocus])

  // ── Scroll to first error if off-screen ─────────────────
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [errors])

  // ── Keyboard shortcuts ──────────────────────────────────
  const onSubmitRef = useCallback(
    () => rhfHandleSubmit(onSubmitHandler)(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        onSubmitRef()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onSubmitRef])

  // ── Error border class helper ─────────────────────────────
  const errBorder = (name: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errors as Record<string, any>)[name]
      ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
      : ""

  // ── Submit (data is validated & coerced by Zod) ───────────
  const onSubmitHandler = async (data: BienFormInput) => {
    if (isSubmitting) return

    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un bien")
      return
    }

    // Lots validation (manual, not in Zod schema)
    if (multipleLots) {
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

    setIsSubmitting(true)
    setLoading(true)

    try {
      // Convertir en mensuel si l'utilisateur a saisi en annuel
      const diviseur = modeCharges === 'annuel' ? 12 : 1

      // Calculer le loyer total (somme des lots en mode multi, ou loyer direct en mode simple)
      const loyerTotal = multipleLots
        ? lots.reduce((sum, lot) => sum + parseFloat(lot.loyerMensuel || "0"), 0)
        : data.loyerMensuel

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bienPayload: any = {
        nom: data.nom,
        adresse: data.adresse,
        ville: data.ville,
        codePostal: data.codePostal,
        loyerMensuel: loyerTotal,
        typeFinancement: data.typeFinancement,
        taxeFonciere: (data.taxeFonciere || 0) / diviseur,
        chargesCopro: (data.chargesCopro || 0) / diviseur,
        assurance: (data.assurance || 0) / diviseur,
        fraisGestion: (data.fraisGestion || 0) / diviseur,
        autresCharges: (data.autresCharges || 0) / diviseur,
        chargesMensuelles: 0,
      }

      if (data.typeFinancement === "CREDIT") {
        const mensualite = calculateMensualiteCredit(
          data.montantCredit!,
          data.tauxCredit!,
          data.dureeCredit!
        )

        bienPayload.mensualiteCredit = mensualite
        bienPayload.montantCredit = data.montantCredit
        bienPayload.tauxCredit = data.tauxCredit
        bienPayload.dureeCredit = data.dureeCredit
        bienPayload.dateDebutCredit = data.dateDebutCredit || null
      }

      if (isEditMode && bien) {
        // MODE ÉDITION : mettre à jour le bien existant
        await updateBien(bien.id, bienPayload)

        toast.success("Bien modifié avec succès !")
        queryClient.invalidateQueries({ queryKey: ['biens'] })
        queryClient.invalidateQueries({ queryKey: ['bien', bien.id] })
        onSuccess?.()
      } else {
        // MODE CRÉATION : créer le bien + lots
        const nouveauBien = await createBien(user.id, bienPayload)

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

        reset()
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
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
              💡 <kbd className="px-1 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">Ctrl+Entrée</kbd> pour soumettre
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Validation summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mx-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              ⚠️ Veuillez corriger les erreurs suivantes :
            </p>
            <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-0.5">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => {
                      try { setFocus(field as keyof BienFormInput) } catch { /* field may not be mounted */ }
                    }}
                    className="underline hover:no-underline"
                  >
                    {error?.message as string}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={rhfHandleSubmit(onSubmitHandler)} className="flex-1 overflow-y-auto px-2 space-y-6 py-1">
          {/* ────────────────────────────────────────────────── */}
          {/* Section 1: Informations de base                    */}
          {/* ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Informations de base
              </h3>
            </div>

            {/* Nom */}
            <div>
              <Label htmlFor="nom" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Nom du bien <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                {...register("nom")}
                placeholder="Ex: Appartement Paris 15e"
                disabled={loading}
                className={errBorder("nom")}
              />
              <FieldError message={errors.nom?.message as string} />
            </div>

            {/* Adresse + Code postal */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="adresse" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adresse"
                  {...register("adresse")}
                  placeholder="Ex: 12 rue de la Paix"
                  disabled={loading}
                  className={errBorder("adresse")}
                />
                <FieldError message={errors.adresse?.message as string} />
              </div>

              <div>
                <Label htmlFor="codePostal" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                  Code postal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="codePostal"
                  {...register("codePostal")}
                  placeholder="75015"
                  disabled={loading}
                  className={errBorder("codePostal")}
                />
                <FieldError message={errors.codePostal?.message as string} />
              </div>
            </div>

            {/* Ville */}
            <div>
              <Label htmlFor="ville" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ville"
                {...register("ville")}
                placeholder="Ex: Paris"
                disabled={loading}
                className={errBorder("ville")}
              />
              <FieldError message={errors.ville?.message as string} />
            </div>
          </div>

          {/* ────────────────────────────────────────────────── */}
          {/* Section 2: Loyers et charges                       */}
          {/* ────────────────────────────────────────────────── */}
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
                  Loyer mensuel (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="loyerMensuel"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  {...register("loyerMensuel")}
                  placeholder="Ex: 900"
                  disabled={loading}
                  className={errBorder("loyerMensuel")}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <FieldError message={errors.loyerMensuel?.message as string} />
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

            {/* Charges (optionnel) */}
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
                    inputMode="decimal"
                    {...register("taxeFonciere")}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 150' : 'Ex: 1800'}
                    disabled={loading}
                    className={errBorder("taxeFonciere")}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError message={errors.taxeFonciere?.message as string} />
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
                    inputMode="decimal"
                    {...register("chargesCopro")}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 200' : 'Ex: 2400'}
                    disabled={loading}
                    className={errBorder("chargesCopro")}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError message={errors.chargesCopro?.message as string} />
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
                    inputMode="decimal"
                    {...register("assurance")}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 30' : 'Ex: 360'}
                    disabled={loading}
                    className={errBorder("assurance")}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError message={errors.assurance?.message as string} />
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
                    inputMode="decimal"
                    {...register("fraisGestion")}
                    placeholder={modeCharges === 'mensuel' ? 'Ex: 80' : 'Ex: 960'}
                    disabled={loading}
                    className={errBorder("fraisGestion")}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <FieldError message={errors.fraisGestion?.message as string} />
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
                  inputMode="decimal"
                  {...register("autresCharges")}
                  placeholder={modeCharges === 'mensuel' ? 'Ex: 50' : 'Ex: 600'}
                  disabled={loading}
                  className={errBorder("autresCharges")}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <FieldError message={errors.autresCharges?.message as string} />
              </div>

              {modeCharges === 'annuel' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  💡 Les montants annuels seront automatiquement convertis en mensuel pour le stockage.
                </p>
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────────── */}
          {/* Section 3: Financement                             */}
          {/* ────────────────────────────────────────────────── */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Financement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peut être complété plus tard</p>
              </div>
            </div>
            
            {/* Type de financement */}
            <div>
              <Label htmlFor="typeFinancement" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                Type de financement
              </Label>
              <select
                id="typeFinancement"
                {...register("typeFinancement")}
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
                disabled={loading}
              >
                <option value="CREDIT">Crédit</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {/* Champs crédit (affichés si typeFinancement === "CREDIT") */}
            {typeFinancement === "CREDIT" && (
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateDebutCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Date de début du crédit
                    </Label>
                    <Input
                      id="dateDebutCredit"
                      type="date"
                      {...register("dateDebutCredit")}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dureeCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Durée (mois) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dureeCredit"
                      type="number"
                      step="1"
                      min="1"
                      inputMode="numeric"
                      {...register("dureeCredit")}
                      placeholder="Ex: 240"
                      disabled={loading}
                      className={errBorder("dureeCredit")}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError message={errors.dureeCredit?.message as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montantCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Montant emprunté (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montantCredit"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      {...register("montantCredit")}
                      placeholder="Ex: 200000"
                      disabled={loading}
                      className={errBorder("montantCredit")}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError message={errors.montantCredit?.message as string} />
                  </div>
                  <div>
                    <Label htmlFor="tauxCredit" className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">
                      Taux d&apos;intérêt (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tauxCredit"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      inputMode="decimal"
                      {...register("tauxCredit")}
                      placeholder="Ex: 3.5"
                      disabled={loading}
                      className={errBorder("tauxCredit")}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <FieldError message={errors.tauxCredit?.message as string} />
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
              onClick={() => {
                if (isDirty && !loading) {
                  const confirmClose = window.confirm(
                    "Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?"
                  )
                  if (!confirmClose) return
                }
                onOpenChange?.(false)
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || isSubmitting} className="min-w-[200px]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? "Modification..." : "Création..."}
                </span>
              ) : (
                isEditMode ? "Enregistrer les modifications" : "Ajouter le bien"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
