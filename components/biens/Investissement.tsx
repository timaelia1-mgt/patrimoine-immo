"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/calculations"
import { updateBien } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface InvestissementProps {
  bien: any
}

interface InvestissementSecondaire {
  id: string
  date: string
  description: string
  montant: number
}

export function Investissement({ bien }: InvestissementProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    prixAchat: bien.prixAchat?.toString() || "0",
    fraisNotaire: bien.fraisNotaire?.toString() || "0",
    travauxInitiaux: bien.travauxInitiaux?.toString() || "0",
    autresFrais: bien.autresFrais?.toString() || "0",
  })

  // Investissements secondaires (stockés dans localStorage)
  const [investissementsSecondaires, setInvestissementsSecondaires] = useState<InvestissementSecondaire[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`investissements-secondaires-${bien.id}`)
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return []
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [newInvestissement, setNewInvestissement] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    montant: "",
  })

  // Calculs
  const investissementInitial = 
    parseFloat(formData.prixAchat) +
    parseFloat(formData.fraisNotaire) +
    parseFloat(formData.travauxInitiaux) +
    parseFloat(formData.autresFrais)

  const totalInvestissementsSecondaires = investissementsSecondaires.reduce(
    (sum, inv) => sum + inv.montant, 
    0
  )

  const investissementTotal = investissementInitial + totalInvestissementsSecondaires

  const handleSave = async () => {
    try {
      await updateBien(bien.id, {
        prixAchat: parseFloat(formData.prixAchat),
        fraisNotaire: parseFloat(formData.fraisNotaire),
        travauxInitiaux: parseFloat(formData.travauxInitiaux),
        autresFrais: parseFloat(formData.autresFrais),
      })

      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  const handleAddInvestissement = () => {
    if (!newInvestissement.description || !newInvestissement.montant) {
      alert("Veuillez remplir tous les champs")
      return
    }

    const nouveauInv: InvestissementSecondaire = {
      id: Date.now().toString(),
      date: newInvestissement.date,
      description: newInvestissement.description,
      montant: parseFloat(newInvestissement.montant),
    }

    const updated = [...investissementsSecondaires, nouveauInv]
    setInvestissementsSecondaires(updated)
    
    // Sauvegarder dans localStorage
    localStorage.setItem(`investissements-secondaires-${bien.id}`, JSON.stringify(updated))
    
    // Réinitialiser le formulaire
    setNewInvestissement({
      date: new Date().toISOString().split('T')[0],
      description: "",
      montant: "",
    })
    setShowAddForm(false)
  }

  const handleDeleteInvestissement = (id: string) => {
    if (!confirm("Supprimer cet investissement ?")) return

    const updated = investissementsSecondaires.filter(inv => inv.id !== id)
    setInvestissementsSecondaires(updated)
    localStorage.setItem(`investissements-secondaires-${bien.id}`, JSON.stringify(updated))
  }

  // Estimation frais de notaire
  const estimerFraisNotaire = () => {
    const prix = parseFloat(formData.prixAchat || "0")
    if (!prix) return null
    return prix * 0.075 // 7.5% en moyenne
  }

  const fraisNotaireEstimes = estimerFraisNotaire()

  return (
    <div className="space-y-6">
      {/* Résumé investissement total */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Investissement initial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(investissementInitial)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Achat + frais + travaux
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Investissements secondaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalInvestissementsSecondaires)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {investissementsSecondaires.length} investissement(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total investi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(investissementTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investissement initial */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investissement initial</CardTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prixAchat">Prix d'achat (€)</Label>
              <Input
                id="prixAchat"
                type="number"
                step="0.01"
                value={formData.prixAchat}
                onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="fraisNotaire">Frais de notaire (€)</Label>
              <Input
                id="fraisNotaire"
                type="number"
                step="0.01"
                value={formData.fraisNotaire}
                onChange={(e) => setFormData({ ...formData, fraisNotaire: e.target.value })}
                disabled={!editing}
              />
              {editing && fraisNotaireEstimes && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fraisNotaire: fraisNotaireEstimes.toFixed(2) })}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  💡 Utiliser l'estimation ({formatCurrency(fraisNotaireEstimes)})
                </button>
              )}
            </div>
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
                disabled={!editing}
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
                disabled={!editing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investissements secondaires */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investissements secondaires</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Travaux, réparations, améliorations effectués après l'achat
              </p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
              {showAddForm ? "Annuler" : "+ Ajouter"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newInvestissement.date}
                  onChange={(e) => setNewInvestissement({ ...newInvestissement, date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newInvestissement.description}
                  onChange={(e) => setNewInvestissement({ ...newInvestissement, description: e.target.value })}
                  placeholder="Ex: Réfection toiture, Changement chaudière..."
                />
              </div>

              <div>
                <Label htmlFor="montant">Montant (€)</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  value={newInvestissement.montant}
                  onChange={(e) => setNewInvestissement({ ...newInvestissement, montant: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddInvestissement}>Ajouter</Button>
              </div>
            </div>
          )}

          {/* Liste des investissements */}
          {investissementsSecondaires.length > 0 ? (
            <div className="space-y-2">
              {investissementsSecondaires.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium">{inv.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(inv.montant)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInvestissement(inv.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun investissement secondaire pour le moment</p>
              <p className="text-xs mt-1">Cliquez sur "+ Ajouter" pour en créer un</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
