"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/calculations"
import { updateBien } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ChargesProps {
  bien: any
}

export function Charges({ bien }: ChargesProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    taxeFonciere: bien.taxeFonciere?.toString() || "0",
    chargesCopro: bien.chargesCopro?.toString() || "0",
    assurance: bien.assurance?.toString() || "0",
    fraisGestion: bien.fraisGestion?.toString() || "0",
    autresCharges: bien.autresCharges?.toString() || "0",
  })

  const handleSave = async () => {
    try {
      await updateBien(bien.id, {
        taxeFonciere: parseFloat(formData.taxeFonciere),
        chargesCopro: parseFloat(formData.chargesCopro),
        assurance: parseFloat(formData.assurance),
        fraisGestion: parseFloat(formData.fraisGestion),
        autresCharges: parseFloat(formData.autresCharges),
      })

      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  const totalCharges = 
    parseFloat(formData.taxeFonciere) +
    parseFloat(formData.chargesCopro) +
    parseFloat(formData.assurance) +
    parseFloat(formData.fraisGestion) +
    parseFloat(formData.autresCharges)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Charges mensuelles</CardTitle>
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
              <Label htmlFor="taxeFonciere">Taxe foncière (€/mois)</Label>
              <Input
                id="taxeFonciere"
                type="number"
                step="0.01"
                value={formData.taxeFonciere}
                onChange={(e) => setFormData({ ...formData, taxeFonciere: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="chargesCopro">Charges copro (€/mois)</Label>
              <Input
                id="chargesCopro"
                type="number"
                step="0.01"
                value={formData.chargesCopro}
                onChange={(e) => setFormData({ ...formData, chargesCopro: e.target.value })}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assurance">Assurance (€/mois)</Label>
              <Input
                id="assurance"
                type="number"
                step="0.01"
                value={formData.assurance}
                onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="fraisGestion">Frais de gestion (€/mois)</Label>
              <Input
                id="fraisGestion"
                type="number"
                step="0.01"
                value={formData.fraisGestion}
                onChange={(e) => setFormData({ ...formData, fraisGestion: e.target.value })}
                disabled={!editing}
              />
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
              disabled={!editing}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg mt-4">
            <p className="text-sm text-muted-foreground mb-2">Total des charges mensuelles</p>
            <p className="text-3xl font-bold">{formatCurrency(totalCharges)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
