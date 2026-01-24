"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BienFormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function BienFormDialog({ open, onOpenChange, onSuccess }: BienFormDialogProps) {
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
    mensualiteCredit: "",
    dateDebutCredit: "",
    montantCredit: "",
    tauxCredit: "",
    dureeCredit: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: any = {
      nom: formData.nom,
      adresse: formData.adresse,
      ville: formData.ville,
      codePostal: formData.codePostal,
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
      const mensualite = parseFloat(formData.mensualiteCredit)
      data.mensualiteCredit = mensualite
      data.montantCredit = formData.montantCredit ? parseFloat(formData.montantCredit) : (mensualite * 240)
      data.tauxCredit = formData.tauxCredit ? parseFloat(formData.tauxCredit) : 3.5
      data.dureeCredit = formData.dureeCredit ? parseInt(formData.dureeCredit) : 240
      data.dateDebutCredit = formData.dateDebutCredit ? new Date(formData.dateDebutCredit) : null
    }

    try {
      const response = await fetch("/api/biens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
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
          mensualiteCredit: "",
          dateDebutCredit: "",
          montantCredit: "",
          tauxCredit: "",
          dureeCredit: "",
        })
        onOpenChange?.(false)
        onSuccess?.()
        window.location.reload()
      } else {
        alert("Erreur lors de l'ajout du bien")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'ajout du bien")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un bien immobilier</DialogTitle>
          <DialogDescription>
            Remplissez les informations de base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom du bien *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Appartement Paris 15e"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="adresse">Adresse *</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Ex: 12 rue de la Paix"
                required
              />
            </div>

            <div>
              <Label htmlFor="codePostal">Code postal *</Label>
              <Input
                id="codePostal"
                value={formData.codePostal}
                onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                placeholder="75015"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ville">Ville *</Label>
            <Input
              id="ville"
              value={formData.ville}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              placeholder="Paris"
              required
            />
          </div>

          <div>
            <Label htmlFor="loyerMensuel">Loyer mensuel (€) *</Label>
            <Input
              id="loyerMensuel"
              type="number"
              step="0.01"
              value={formData.loyerMensuel}
              onChange={(e) => setFormData({ ...formData, loyerMensuel: e.target.value })}
              placeholder="900"
              required
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Charges mensuelles (optionnel)</h3>
              <p className="text-xs text-muted-foreground">Peut être complété plus tard</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxeFonciere">Taxe foncière (€/mois)</Label>
                <Input
                  id="taxeFonciere"
                  type="number"
                  step="0.01"
                  value={formData.taxeFonciere || ""}
                  onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="chargesCopro">Charges copro (€/mois)</Label>
                <Input
                  id="chargesCopro"
                  type="number"
                  step="0.01"
                  value={formData.chargesCopro || ""}
                  onChange={(e) => setFormData({ ...formData, chargesCopro: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assurance">Assurance PNO (€/mois)</Label>
                <Input
                  id="assurance"
                  type="number"
                  step="0.01"
                  value={formData.assurance || ""}
                  onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="fraisGestion">Frais de gestion (€/mois)</Label>
                <Input
                  id="fraisGestion"
                  type="number"
                  step="0.01"
                  value={formData.fraisGestion || ""}
                  onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="autresCharges">Autres charges (€/mois)</Label>
              <Input
                id="autresCharges"
                type="number"
                step="0.01"
                value={formData.autresCharges || ""}
                onChange={(e) => setFormData({ ...formData, autresCharges: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Financement</h3>
              <p className="text-xs text-muted-foreground">Peut être complété plus tard</p>
            </div>
            
            <div>
              <Label htmlFor="typeFinancement">Type de financement *</Label>
              <select
                id="typeFinancement"
                value={formData.typeFinancement}
                onChange={(e) => setFormData({ ...formData, typeFinancement: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                required
              >
                <option value="CREDIT">Crédit</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {formData.typeFinancement === "CREDIT" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateDebutCredit">Date de début du crédit</Label>
                    <Input
                      id="dateDebutCredit"
                      type="date"
                      value={formData.dateDebutCredit}
                      onChange={(e) => setFormData({ ...formData, dateDebutCredit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dureeCredit">Durée (mois)</Label>
                    <Input
                      id="dureeCredit"
                      type="number"
                      value={formData.dureeCredit}
                      onChange={(e) => setFormData({ ...formData, dureeCredit: e.target.value })}
                      placeholder="240"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montantCredit">Montant emprunté (€)</Label>
                    <Input
                      id="montantCredit"
                      type="number"
                      step="0.01"
                      value={formData.montantCredit}
                      onChange={(e) => setFormData({ ...formData, montantCredit: e.target.value })}
                      placeholder="200000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tauxCredit">Taux d'intérêt (%)</Label>
                    <Input
                      id="tauxCredit"
                      type="number"
                      step="0.01"
                      value={formData.tauxCredit}
                      onChange={(e) => setFormData({ ...formData, tauxCredit: e.target.value })}
                      placeholder="3.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mensualiteCredit">Mensualité (€) *</Label>
                  <Input
                    id="mensualiteCredit"
                    type="number"
                    step="0.01"
                    value={formData.mensualiteCredit}
                    onChange={(e) => setFormData({ ...formData, mensualiteCredit: e.target.value })}
                    placeholder="1000"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Les détails du crédit pourront être enrichis plus tard si vous ne les avez pas
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Annuler
            </Button>
            <Button type="submit">Ajouter le bien</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
