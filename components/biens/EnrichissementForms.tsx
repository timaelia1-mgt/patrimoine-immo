"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateBien, upsertLocataire } from "@/lib/database"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bienId: string
  onSuccess: () => void
}

export function FinancementForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    dateDebutCredit: "",
    montantCredit: "",
    tauxCredit: "",
    dureeCredit: "",
    mensualiteCredit: "",
  })

  // Calcul automatique de la mensualité
  const calculerMensualite = () => {
    const montant = parseFloat(formData.montantCredit || "0")
    const tauxMensuel = parseFloat(formData.tauxCredit || "0") / 100 / 12
    const duree = parseInt(formData.dureeCredit || "0")

    if (!montant || !tauxMensuel || !duree) return null

    // Formule de mensualité : M = C × (t × (1 + t)^n) / ((1 + t)^n - 1)
    const mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, duree)) / (Math.pow(1 + tauxMensuel, duree) - 1)

    return mensualite
  }

  const mensualiteCalculee = calculerMensualite()

  // Calcul automatique du capital restant dû
  const calculerCapitalRestant = () => {
    const dateDebut = formData.dateDebutCredit ? new Date(formData.dateDebutCredit) : null
    const montant = parseFloat(formData.montantCredit || "0")
    const taux = parseFloat(formData.tauxCredit || "0") / 100 / 12 // Taux mensuel
    const duree = parseInt(formData.dureeCredit || "0")
    const mensualite = mensualiteCalculee || parseFloat(formData.mensualiteCredit || "0")

    if (!dateDebut || !montant || !taux || !duree || !mensualite) return null

    // Nombre de mois écoulés depuis le début
    const moisEcoules = Math.floor(
      (new Date().getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    if (moisEcoules <= 0) return montant

    // Formule du capital restant dû avec amortissement
    const capitalRestant = montant * Math.pow(1 + taux, moisEcoules) - 
                          mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)

    return Math.max(0, capitalRestant)
  }

  const capitalRestant = calculerCapitalRestant()
  const moisRestants = formData.dureeCredit && formData.dateDebutCredit
    ? parseInt(formData.dureeCredit) - Math.floor(
        (new Date().getTime() - new Date(formData.dateDebutCredit).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateBien(bienId, {
        enrichissementFinancement: true,
        dateDebutCredit: formData.dateDebutCredit ? formData.dateDebutCredit : null,
        montantCredit: formData.montantCredit ? parseFloat(formData.montantCredit) : null,
        tauxCredit: formData.tauxCredit ? parseFloat(formData.tauxCredit) : null,
        dureeCredit: formData.dureeCredit ? parseInt(formData.dureeCredit) : null,
        mensualiteCredit: mensualiteCalculee ? mensualiteCalculee : (formData.mensualiteCredit ? parseFloat(formData.mensualiteCredit) : null),
        capitalRestantDu: capitalRestant || null,
      })
      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la mise à jour du financement:", error)
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            🏦 Enrichir le financement
          </DialogTitle>
          <DialogDescription>
            Renseignez les détails de votre crédit. Le capital restant dû sera calculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du crédit */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informations du crédit
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateDebutCredit">Date de début *</Label>
                <Input
                  id="dateDebutCredit"
                  type="date"
                  value={formData.dateDebutCredit}
                  onChange={(e) => setFormData({ ...formData, dateDebutCredit: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dureeCredit">Durée totale (mois) *</Label>
                <Input
                  id="dureeCredit"
                  type="number"
                  value={formData.dureeCredit}
                  onChange={(e) => setFormData({ ...formData, dureeCredit: e.target.value })}
                  placeholder="240"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montantCredit">Montant emprunté (€) *</Label>
                <Input
                  id="montantCredit"
                  type="number"
                  step="0.01"
                  value={formData.montantCredit}
                  onChange={(e) => setFormData({ ...formData, montantCredit: e.target.value })}
                  placeholder="200000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tauxCredit">Taux d'intérêt (%) *</Label>
                <Input
                  id="tauxCredit"
                  type="number"
                  step="0.01"
                  value={formData.tauxCredit}
                  onChange={(e) => setFormData({ ...formData, tauxCredit: e.target.value })}
                  placeholder="3.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mensualiteCredit">Mensualité (€)</Label>
              {mensualiteCalculee !== null ? (
                <div className="relative">
                  <Input
                    id="mensualiteCredit"
                    type="number"
                    step="0.01"
                    value={mensualiteCalculee.toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mensualiteCredit: mensualiteCalculee.toFixed(2) })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    ✓ Utiliser
                  </button>
                </div>
              ) : (
                <Input
                  id="mensualiteCredit"
                  type="number"
                  step="0.01"
                  value={formData.mensualiteCredit}
                  onChange={(e) => setFormData({ ...formData, mensualiteCredit: e.target.value })}
                  placeholder="Remplissez les champs ci-dessus"
                  required
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {mensualiteCalculee !== null 
                  ? "💡 Mensualité calculée automatiquement"
                  : "Sera calculée automatiquement"}
              </p>
            </div>
          </div>

          {/* Calculs automatiques */}
          {capitalRestant !== null && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <h3 className="font-semibold text-sm text-blue-900">
                📊 Calculs automatiques
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Capital restant dû</p>
                  <p className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(capitalRestant)}
                  </p>
                </div>

                {moisRestants !== null && moisRestants > 0 && (
                  <div>
                    <p className="text-muted-foreground">Mois restants</p>
                    <p className="text-lg font-bold text-blue-600">
                      {moisRestants} mois
                    </p>
                  </div>
                )}
              </div>

              {moisRestants !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Progression</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((parseInt(formData.dureeCredit) - moisRestants) / parseInt(formData.dureeCredit)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Enrichir le financement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InvestissementForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    prixAchat: "",
    fraisNotaire: "",
    travauxInitiaux: "",
    autresFrais: "",
  })

  // Calcul automatique du total investi
  const totalInvesti = 
    parseFloat(formData.prixAchat || "0") +
    parseFloat(formData.fraisNotaire || "0") +
    parseFloat(formData.travauxInitiaux || "0") +
    parseFloat(formData.autresFrais || "0")

  // Calcul automatique des frais de notaire (estimation 7-8% du prix d'achat)
  const estimerFraisNotaire = () => {
    const prix = parseFloat(formData.prixAchat || "0")
    if (!prix) return null
    return prix * 0.075 // 7.5% en moyenne
  }

  const fraisNotaireEstimes = estimerFraisNotaire()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateBien(bienId, {
        enrichissementInvestissement: true,
        prixAchat: formData.prixAchat ? parseFloat(formData.prixAchat) : null,
        fraisNotaire: formData.fraisNotaire ? parseFloat(formData.fraisNotaire) : null,
        travauxInitiaux: formData.travauxInitiaux ? parseFloat(formData.travauxInitiaux) : null,
        autresFrais: formData.autresFrais ? parseFloat(formData.autresFrais) : null,
      })
      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'investissement:", error)
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            💰 Enrichir l'investissement
          </DialogTitle>
          <DialogDescription>
            Détaillez votre investissement initial. Les frais de notaire peuvent être estimés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Investissement initial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Investissement initial
            </h3>
            
            <div>
              <Label htmlFor="prixAchat">Prix d'achat (€) *</Label>
              <Input
                id="prixAchat"
                type="number"
                step="0.01"
                value={formData.prixAchat}
                onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                placeholder="200000"
                required
              />
            </div>

            <div>
              <Label htmlFor="fraisNotaire">Frais de notaire (€)</Label>
              {fraisNotaireEstimes !== null ? (
                <div className="space-y-2">
                  <Input
                    id="fraisNotaire"
                    type="number"
                    step="0.01"
                    value={formData.fraisNotaire}
                    onChange={(e) => setFormData({ ...formData, fraisNotaire: e.target.value })}
                    placeholder={fraisNotaireEstimes.toFixed(2)}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fraisNotaire: fraisNotaireEstimes.toFixed(2) })}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    💡 Utiliser l'estimation ({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fraisNotaireEstimes)})
                  </button>
                </div>
              ) : (
                <Input
                  id="fraisNotaire"
                  type="number"
                  step="0.01"
                  value={formData.fraisNotaire}
                  onChange={(e) => setFormData({ ...formData, fraisNotaire: e.target.value })}
                  placeholder="15000"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Généralement entre 7% et 8% du prix d'achat
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="travauxInitiaux">Travaux initiaux (€)</Label>
                <Input
                  id="travauxInitiaux"
                  type="number"
                  step="0.01"
                  value={formData.travauxInitiaux}
                  onChange={(e) => setFormData({ ...formData, travauxInitiaux: e.target.value })}
                  placeholder="25000"
                />
              </div>

              <div>
                <Label htmlFor="autresFrais">Autres frais (€)</Label>
                <Input
                  id="autresFrais"
                  type="number"
                  step="0.01"
                  value={formData.autresFrais}
                  onChange={(e) => setFormData({ ...formData, autresFrais: e.target.value })}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Meubles, électroménager, etc.
                </p>
              </div>
            </div>
          </div>

          {/* Total investi */}
          {totalInvesti > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-sm text-green-900 mb-2">
                📊 Total investi
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalInvesti)}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Enrichir l'investissement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function HistoriqueForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    dateAcquisition: "",
    dateMiseEnLocation: "",
  })

  // Calcul de la durée entre acquisition et location
  const calculerDelai = () => {
    if (!formData.dateAcquisition || !formData.dateMiseEnLocation) return null
    
    const dateAcq = new Date(formData.dateAcquisition)
    const dateLoc = new Date(formData.dateMiseEnLocation)
    
    const diffMs = dateLoc.getTime() - dateAcq.getTime()
    const diffMois = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
    
    return diffMois
  }

  const delai = calculerDelai()

  // Calcul de la durée de possession
  const dureeePossession = formData.dateAcquisition
    ? Math.floor((new Date().getTime() - new Date(formData.dateAcquisition).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateBien(bienId, {
        enrichissementHistorique: true,
        dateAcquisition: formData.dateAcquisition ? formData.dateAcquisition : null,
        dateMiseEnLocation: formData.dateMiseEnLocation ? formData.dateMiseEnLocation : null,
      })
      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'historique:", error)
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            📅 Enrichir l'historique
          </DialogTitle>
          <DialogDescription>
            Renseignez les dates clés du bien. Les durées seront calculées automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dates clés */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Dates clés
            </h3>
            
            <div>
              <Label htmlFor="dateAcquisition">Date d'acquisition *</Label>
              <Input
                id="dateAcquisition"
                type="date"
                value={formData.dateAcquisition}
                onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Date de signature de l'acte de vente
              </p>
            </div>

            <div>
              <Label htmlFor="dateMiseEnLocation">Date de mise en location</Label>
              <Input
                id="dateMiseEnLocation"
                type="date"
                value={formData.dateMiseEnLocation}
                onChange={(e) => setFormData({ ...formData, dateMiseEnLocation: e.target.value })}
                min={formData.dateAcquisition}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Date d'entrée du premier locataire
              </p>
            </div>
          </div>

          {/* Calculs automatiques */}
          {(delai !== null || dureeePossession !== null) && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
              <h3 className="font-semibold text-sm text-purple-900">
                📊 Informations calculées
              </h3>
              
              <div className="space-y-2 text-sm">
                {delai !== null && (
                  <div>
                    <p className="text-muted-foreground">Délai acquisition → location</p>
                    <p className="text-lg font-bold text-purple-600">
                      {delai} mois
                    </p>
                  </div>
                )}

                {dureeePossession !== null && dureeePossession > 0 && (
                  <div>
                    <p className="text-muted-foreground">Durée de possession</p>
                    <p className="text-lg font-bold text-purple-600">
                      {dureeePossession} mois ({Math.floor(dureeePossession / 12)} ans et {dureeePossession % 12} mois)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Enrichir l'historique
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ChargesForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    taxeFonciere: "",
    chargesCopro: "",
    assurance: "",
    fraisGestion: "",
    autresCharges: "",
  })

  const totalCharges = 
    parseFloat(formData.taxeFonciere || "0") +
    parseFloat(formData.chargesCopro || "0") +
    parseFloat(formData.assurance || "0") +
    parseFloat(formData.fraisGestion || "0") +
    parseFloat(formData.autresCharges || "0")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateBien(bienId, {
        enrichissementCharges: true,
        taxeFonciere: formData.taxeFonciere ? parseFloat(formData.taxeFonciere) : 0,
        chargesCopro: formData.chargesCopro ? parseFloat(formData.chargesCopro) : 0,
        assurance: formData.assurance ? parseFloat(formData.assurance) : 0,
        fraisGestion: formData.fraisGestion ? parseFloat(formData.fraisGestion) : 0,
        autresCharges: formData.autresCharges ? parseFloat(formData.autresCharges) : 0,
        chargesMensuelles: totalCharges,
      })
      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la mise à jour des charges:", error)
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            💸 Enrichir les charges
          </DialogTitle>
          <DialogDescription>
            Détaillez toutes vos charges mensuelles. Le total sera calculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Charges mensuelles
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxeFonciere">Taxe foncière (€/mois)</Label>
                <Input
                  id="taxeFonciere"
                  type="number"
                  step="0.01"
                  value={formData.taxeFonciere}
                  onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Montant annuel divisé par 12
                </p>
              </div>

              <div>
                <Label htmlFor="chargesCopro">Charges copropriété (€/mois)</Label>
                <Input
                  id="chargesCopro"
                  type="number"
                  step="0.01"
                  value={formData.chargesCopro}
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
                  value={formData.assurance}
                  onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Propriétaire Non Occupant
                </p>
              </div>

              <div>
                <Label htmlFor="fraisGestion">Frais de gestion (€/mois)</Label>
                <Input
                  id="fraisGestion"
                  type="number"
                  step="0.01"
                  value={formData.fraisGestion}
                  onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Agence immobilière (si géré)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="autresCharges">Autres charges (€/mois)</Label>
              <Input
                id="autresCharges"
                type="number"
                step="0.01"
                value={formData.autresCharges}
                onChange={(e) => setFormData({ ...formData, autresCharges: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {totalCharges > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-sm text-orange-900 mb-2">
                📊 Total des charges mensuelles
              </h3>
              <p className="text-3xl font-bold text-orange-600">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalCharges)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Enrichir les charges
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RentabiliteForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    revenusAnterieursOverride: "",
    chargesAnterieuresOverride: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Convertir les valeurs vides en null (les inputs number retournent "" si vides)
      const revenus = formData.revenusAnterieursOverride && formData.revenusAnterieursOverride !== ""
        ? parseFloat(formData.revenusAnterieursOverride) 
        : null
      const charges = formData.chargesAnterieuresOverride && formData.chargesAnterieuresOverride !== ""
        ? parseFloat(formData.chargesAnterieuresOverride) 
        : null

      await updateBien(bienId, {
        enrichissementRentabilite: true,
        revenusAnterieursOverride: revenus,
        chargesAnterieuresOverride: charges,
      })
      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la rentabilité:", error)
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            📈 Enrichir la rentabilité
          </DialogTitle>
          <DialogDescription>
            Renseignez vos revenus et charges cumulés depuis l'acquisition (optionnel).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Données cumulées (optionnel)
            </h3>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Par défaut</strong>, l'application calcule automatiquement vos revenus et charges cumulés
                depuis la date d'acquisition. Remplissez ces champs uniquement si vous avez des données précises à corriger.
              </p>
            </div>
            
            <div>
              <Label htmlFor="revenusAnterieursOverride">Revenus cumulés totaux (€)</Label>
              <Input
                id="revenusAnterieursOverride"
                type="number"
                step="0.01"
                value={formData.revenusAnterieursOverride}
                onChange={(e) => setFormData({ ...formData, revenusAnterieursOverride: e.target.value })}
                placeholder="Laissez vide pour calcul automatique"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total de tous les loyers encaissés depuis l'acquisition
              </p>
            </div>

            <div>
              <Label htmlFor="chargesAnterieuresOverride">Charges cumulées totales (€)</Label>
              <Input
                id="chargesAnterieuresOverride"
                type="number"
                step="0.01"
                value={formData.chargesAnterieuresOverride}
                onChange={(e) => setFormData({ ...formData, chargesAnterieuresOverride: e.target.value })}
                placeholder="Laissez vide pour calcul automatique"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total de toutes les charges et mensualités depuis l'acquisition
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Enrichir la rentabilité
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LocataireForm({ open, onOpenChange, bienId, onSuccess }: FormDialogProps) {
  const [formData, setFormData] = useState({
    nomLocataire: "",
    prenomLocataire: "",
    emailLocataire: "",
    telephoneLocataire: "",
    dateEntree: "",
    montantAPL: "",
    modePaiement: "virement",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const loyerAPLDeduit = formData.montantAPL 
    ? `Loyer après APL sera déduit automatiquement`
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation : nom et prénom sont obligatoires
    if (!formData.nomLocataire.trim() || !formData.prenomLocataire.trim()) {
      setError("Le nom et le prénom sont obligatoires")
      setIsLoading(false)
      return
    }

    try {
      // 1. Sauvegarder les données locataire dans la table locataires
      await upsertLocataire(bienId, {
        nom: formData.nomLocataire.trim(),
        prenom: formData.prenomLocataire.trim(),
        email: formData.emailLocataire.trim() || null,
        telephone: formData.telephoneLocataire.trim() || null,
        dateEntree: formData.dateEntree || null,
        montantAPL: parseFloat(formData.montantAPL || "0"),
        modePaiement: formData.modePaiement,
      })
      
      // 2. Activer le flag enrichissement
      await updateBien(bienId, {
        enrichissementLocataire: true,
      })
      
      onSuccess()
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du locataire:", err)
      setError(err.message || "Erreur lors de la sauvegarde. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            👤 Enrichir locataire & APL
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de votre locataire actuel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations locataire */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informations du locataire
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomLocataire">Nom</Label>
                <Input
                  id="nomLocataire"
                  type="text"
                  value={formData.nomLocataire}
                  onChange={(e) => setFormData({ ...formData, nomLocataire: e.target.value })}
                  placeholder="Dupont"
                />
              </div>

              <div>
                <Label htmlFor="prenomLocataire">Prénom</Label>
                <Input
                  id="prenomLocataire"
                  type="text"
                  value={formData.prenomLocataire}
                  onChange={(e) => setFormData({ ...formData, prenomLocataire: e.target.value })}
                  placeholder="Jean"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailLocataire">Email</Label>
                <Input
                  id="emailLocataire"
                  type="email"
                  value={formData.emailLocataire}
                  onChange={(e) => setFormData({ ...formData, emailLocataire: e.target.value })}
                  placeholder="jean.dupont@email.com"
                />
              </div>

              <div>
                <Label htmlFor="telephoneLocataire">Téléphone</Label>
                <Input
                  id="telephoneLocataire"
                  type="tel"
                  value={formData.telephoneLocataire}
                  onChange={(e) => setFormData({ ...formData, telephoneLocataire: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dateEntree">Date d'entrée dans le logement</Label>
              <Input
                id="dateEntree"
                type="date"
                value={formData.dateEntree}
                onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })}
              />
            </div>
          </div>

          {/* APL et paiement */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              APL et mode de paiement
            </h3>

            <div>
              <Label htmlFor="montantAPL">Montant APL (€/mois)</Label>
              <Input
                id="montantAPL"
                type="number"
                step="0.01"
                value={formData.montantAPL}
                onChange={(e) => setFormData({ ...formData, montantAPL: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Laissez à 0 si pas d'APL
              </p>
            </div>

            <div>
              <Label htmlFor="modePaiement">Mode de paiement</Label>
              <select
                id="modePaiement"
                value={formData.modePaiement}
                onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="prelevement">Prélèvement automatique</option>
              </select>
            </div>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-900">
              ❌ <strong>Erreur</strong> : {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? "Enregistrement..." : "Enrichir le locataire"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Pour les autres thèmes, on active juste le booléen sans formulaire pour l'instant
// NOTE: Cette fonction ne recharge plus la page. Le composant parent doit gérer le refresh.
export async function enrichirThemeSimple(bienId: string, champ: string) {
  try {
    await updateBien(bienId, { [champ]: true })
    // Le parent doit appeler router.refresh() ou fetchBien() après cette fonction
  } catch (error) {
    console.error("Erreur lors de l'enrichissement:", error)
    alert("Erreur lors de la sauvegarde. Veuillez réessayer.")
    throw error
  }
}
