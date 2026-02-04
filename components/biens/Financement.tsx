"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/calculations"
import { updateBien } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface FinancementProps {
  bien: any
}

export function Financement({ bien }: FinancementProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    dateDebutCredit: bien.dateDebutCredit 
      ? new Date(bien.dateDebutCredit).toISOString().split('T')[0] 
      : "",
    mensualiteCredit: bien.mensualiteCredit?.toString() || "0",
    montantCredit: bien.montantCredit?.toString() || "0",
    tauxCredit: bien.tauxCredit?.toString() || "0",
    dureeCredit: bien.dureeCredit?.toString() || "0",
  })

  // Vérifier si le bien est payé comptant
  const isComptant = bien.typeFinancement === "CASH" || bien.typeFinancement === "comptant" || bien.typeFinancement?.toLowerCase() === "cash"
  const isCredit = bien.typeFinancement === "CREDIT" || bien.typeFinancement === "credit" || bien.typeFinancement?.toLowerCase() === "credit"

  // Calcul de la progression du crédit avec amortissement dégressif
  const calculerProgressionCredit = () => {
    if (!isCredit || !bien.dateDebutCredit || !bien.dureeCredit) {
      return null
    }

    const dateDebut = new Date(bien.dateDebutCredit)
    const maintenant = new Date()
    
    const moisEcoules = Math.floor(
      (maintenant.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    
    const dureeTotal = parseInt(bien.dureeCredit?.toString() || "0")
    const moisRestants = Math.max(0, dureeTotal - moisEcoules)
    
    const montantCredit = parseFloat(bien.montantCredit?.toString() || "0")
    const taux = parseFloat(bien.tauxCredit?.toString() || "0") / 100 / 12 // Taux mensuel
    const mensualite = parseFloat(bien.mensualiteCredit?.toString() || "0")
    
    let capitalRestant: number
    let capitalRembourse: number
    
    // Utiliser le capital restant dû stocké si disponible
    const capitalRestantDu = bien.capitalRestantDu ? parseFloat(bien.capitalRestantDu.toString()) : null
    
    if (capitalRestantDu !== null && capitalRestantDu !== undefined) {
      capitalRestant = capitalRestantDu
      capitalRembourse = montantCredit - capitalRestant
    } else if (moisEcoules > 0 && taux > 0 && mensualite > 0) {
      // ✅ FORMULE CORRECTE avec amortissement dégressif
      capitalRestant = montantCredit * Math.pow(1 + taux, moisEcoules) -
                       mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)
      capitalRestant = Math.max(0, Math.min(montantCredit, capitalRestant))
      capitalRembourse = montantCredit - capitalRestant
    } else {
      // Si pas assez de données, utiliser les valeurs initiales
      capitalRestant = montantCredit
      capitalRembourse = 0
    }
    
    // ✅ Progression RÉELLE basée sur le capital remboursé
    const progression = montantCredit > 0 ? (capitalRembourse / montantCredit) * 100 : 0
    
    return {
      moisEcoules: Math.max(0, moisEcoules),
      moisRestants,
      dureeTotal,
      progression: Math.min(100, Math.max(0, progression)),
      capitalRembourse: Math.max(0, capitalRembourse),
      capitalRestant: Math.max(0, capitalRestant)
    }
  }

  const progressionCredit = calculerProgressionCredit()

  const handleSave = async () => {
    try {
      await updateBien(bien.id, {
        dateDebutCredit: formData.dateDebutCredit ? formData.dateDebutCredit : null,
        mensualiteCredit: parseFloat(formData.mensualiteCredit),
        montantCredit: parseFloat(formData.montantCredit),
        tauxCredit: parseFloat(formData.tauxCredit),
        dureeCredit: parseInt(formData.dureeCredit),
      })

      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  if (isComptant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-slate-900 dark:text-white">Bien payé comptant</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Aucun financement bancaire.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informations du crédit</CardTitle>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">Enregistrer</Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
              </div>
            ) : (
              <Button onClick={() => setEditing(true)} size="sm">Modifier</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date de début du crédit */}
          <div>
            <Label htmlFor="dateDebutCredit">Date de début du crédit</Label>
            <Input
              id="dateDebutCredit"
              type="date"
              value={formData.dateDebutCredit}
              onChange={(e) => setFormData({ ...formData, dateDebutCredit: e.target.value })}
              disabled={!editing}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Date de la première mensualité
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mensualiteCredit">Mensualité (€)</Label>
              <Input
                id="mensualiteCredit"
                type="number"
                step="0.01"
                value={formData.mensualiteCredit}
                onChange={(e) => setFormData({ ...formData, mensualiteCredit: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="montantCredit">Montant total emprunté (€)</Label>
              <Input
                id="montantCredit"
                type="number"
                step="0.01"
                value={formData.montantCredit}
                onChange={(e) => setFormData({ ...formData, montantCredit: e.target.value })}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tauxCredit">Taux d'intérêt (%)</Label>
              <Input
                id="tauxCredit"
                type="number"
                step="0.01"
                value={formData.tauxCredit}
                onChange={(e) => setFormData({ ...formData, tauxCredit: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="dureeCredit">Durée (mois)</Label>
              <Input
                id="dureeCredit"
                type="number"
                value={formData.dureeCredit}
                onChange={(e) => setFormData({ ...formData, dureeCredit: e.target.value })}
                disabled={!editing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isCredit && progressionCredit && (
        <Card>
          <CardHeader>
            <CardTitle>Progression du remboursement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-6 p-6 bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm text-slate-200 dark:text-slate-100">Progression du remboursement</h3>
                <span className="text-2xl font-bold text-blue-400 dark:text-blue-300">
                  {progressionCredit.progression.toFixed(0)}%
                </span>
              </div>
              
              <div className="w-full bg-slate-700 dark:bg-slate-600 rounded-full h-4 mb-3 overflow-hidden">
                <div 
                  className="bg-slate-100 dark:bg-slate-200 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ 
                    width: `${Math.max(0, Math.min(100, progressionCredit.progression))}%`,
                    minWidth: progressionCredit.progression > 0 ? '2%' : '0%'
                  }}
                />
              </div>

              {/* Chiffres détaillés - Montants */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">Capital remboursé</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(progressionCredit.capitalRembourse)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">Capital restant dû</p>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(progressionCredit.capitalRestant)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">Capital total</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(bien.montantCredit || 0)}
                  </p>
                </div>
              </div>

              {/* Chiffres détaillés - Durées */}
              <div className="grid grid-cols-3 gap-4 mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mois écoulés</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {progressionCredit.moisEcoules}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mois restants</p>
                  <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                    {progressionCredit.moisRestants}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Durée totale</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {bien.dureeCredit || 0} mois
                  </p>
                </div>
              </div>

              {progressionCredit.progression >= 100 && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
                  <p className="text-sm font-medium text-green-700">
                    🎉 Crédit entièrement remboursé !
                  </p>
                </div>
              )}

              {progressionCredit.progression < 100 && bien.dateDebutCredit && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Crédit commencé le {new Date(bien.dateDebutCredit).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isCredit && !progressionCredit && (
        <Card>
          <CardHeader>
            <CardTitle>Progression du remboursement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                ⚠️ <strong>Date de début manquante :</strong> Cliquez sur "Modifier" pour ajouter la date de début du crédit 
                afin de voir la progression du remboursement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
