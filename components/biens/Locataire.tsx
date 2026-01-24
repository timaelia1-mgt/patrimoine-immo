"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { useState, useEffect } from "react"

interface LocataireProps {
  bien: any
}

export function Locataire({ bien }: LocataireProps) {
  // Pour l'instant on utilise localStorage
  // TODO: Créer table Locataire dans Prisma et sauvegarder en base
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(() => {
    // Charger depuis localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`locataire-${bien.id}`)
      if (saved) {
        return JSON.parse(saved)
      }
    }
    
    return {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      dateEntree: "",
      montantAPL: "0",
      modePaiement: "virement",
    }
  })

  useEffect(() => {
    console.log("Composant Locataire monté, bien.id:", bien.id)
    const saved = localStorage.getItem(`locataire-${bien.id}`)
    console.log("Données localStorage:", saved)
  }, [bien.id])

  const handleSave = () => {
    try {
      // Validation
      if (!formData.nom || !formData.prenom) {
        alert("Le nom et le prénom sont obligatoires")
        return
      }

      // Sauvegarder dans localStorage
      localStorage.setItem(`locataire-${bien.id}`, JSON.stringify(formData))
      
      console.log("Données sauvegardées:", formData)
      console.log("Clé localStorage:", `locataire-${bien.id}`)
      
      setEditing(false)
      alert("✓ Informations locataire sauvegardées localement. Rechargez la page manuellement pour voir les changements dans l'onglet Loyers.")
    } catch (error: any) {
      console.error("Erreur:", error)
      alert("Erreur lors de la sauvegarde: " + error.message)
    }
  }

  const hasLocataire = formData.nom || formData.prenom
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  const montantAPL = parseFloat(formData.montantAPL || "0")
  const loyerNetLocataire = loyerMensuel - montantAPL

  return (
    <div className="space-y-6">
      {/* Alerte configuration */}
      {!hasLocataire && !editing && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900">
              ⚠️ <strong>Aucun locataire configuré.</strong> Cliquez sur "Configurer" pour ajouter les informations du locataire actuel.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Résumé locataire */}
      {hasLocataire && !editing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations locataire</CardTitle>
              <Button onClick={() => setEditing(true)} size="sm">Modifier</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nom complet</p>
                <p className="font-medium">{formData.prenom} {formData.nom}</p>
              </div>

              {formData.email && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{formData.email}</p>
                </div>
              )}

              {formData.telephone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                  <p className="font-medium">{formData.telephone}</p>
                </div>
              )}

              {formData.dateEntree && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date d'entrée</p>
                  <p className="font-medium">
                    {new Date(formData.dateEntree).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Mode de paiement</p>
                <Badge variant="outline">
                  {formData.modePaiement === 'virement' && '🏦 Virement'}
                  {formData.modePaiement === 'cheque' && '📝 Chèque'}
                  {formData.modePaiement === 'especes' && '💵 Espèces'}
                  {formData.modePaiement === 'prelevement' && '🔄 Prélèvement'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'édition */}
      {(editing || !hasLocataire) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{hasLocataire ? 'Modifier les informations' : 'Configurer le locataire'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Dupont"
                />
              </div>

              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@email.com"
                />
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
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

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-sm">APL et mode de paiement</h3>

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
                  Montant des aides au logement perçues chaque mois
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

            <div className="flex justify-end gap-2 pt-4">
              {hasLocataire && (
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              )}
              <Button onClick={handleSave}>
                {hasLocataire ? 'Enregistrer' : 'Configurer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations financières */}
      {hasLocataire && !editing && (
        <Card>
          <CardHeader>
            <CardTitle>Informations financières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Loyer mensuel total</span>
                <span className="text-lg font-bold">{formatCurrency(loyerMensuel)}</span>
              </div>

              {montantAPL > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dont APL</span>
                    <span className="text-lg font-medium text-purple-600">
                      - {formatCurrency(montantAPL)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Reste à charge locataire</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(loyerNetLocataire)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {montantAPL > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-900">
                  💡 Le suivi des paiements APL est disponible dans l'onglet <strong>Loyers</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Note technique */}
      <Card className="border-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            ℹ️ <strong>Note :</strong> Les informations locataire sont actuellement stockées temporairement. 
            La table Locataire en base de données sera créée prochainement pour une sauvegarde permanente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
