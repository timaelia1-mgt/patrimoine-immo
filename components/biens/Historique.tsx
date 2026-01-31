"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateBien } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface HistoriqueProps {
  bien: any
}

export function Historique({ bien }: HistoriqueProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    dateAcquisition: bien.dateAcquisition ? new Date(bien.dateAcquisition).toISOString().split('T')[0] : "",
    dateMiseEnLocation: bien.dateMiseEnLocation ? new Date(bien.dateMiseEnLocation).toISOString().split('T')[0] : "",
  })

  const handleSave = async () => {
    try {
      await updateBien(bien.id, {
        dateAcquisition: formData.dateAcquisition ? formData.dateAcquisition : null,
        dateMiseEnLocation: formData.dateMiseEnLocation ? formData.dateMiseEnLocation : null,
      })

      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historique du bien</CardTitle>
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
        <div>
          <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
          <Input
            id="dateAcquisition"
            type="date"
            value={formData.dateAcquisition}
            onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
            disabled={!editing}
          />
        </div>

        <div>
          <Label htmlFor="dateMiseEnLocation">Date de mise en location</Label>
          <Input
            id="dateMiseEnLocation"
            type="date"
            value={formData.dateMiseEnLocation}
            onChange={(e) => setFormData({ ...formData, dateMiseEnLocation: e.target.value })}
            disabled={!editing}
          />
        </div>

        {bien.dateAcquisition && bien.dateMiseEnLocation && (
          <div className="p-4 bg-slate-50 rounded-lg mt-4">
            <p className="text-sm text-muted-foreground mb-2">Durée de possession</p>
            <p className="text-lg font-medium">
              {Math.floor((new Date().getTime() - new Date(bien.dateAcquisition).getTime()) / (1000 * 60 * 60 * 24 * 30))} mois
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
