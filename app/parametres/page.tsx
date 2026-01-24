"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ParametresPage() {
  const [settings, setSettings] = useState({
    nom: "Utilisateur",
    email: "user@example.com",
    devise: "EUR",
    jourPaiement: "5",
    delaiPaiement: "5",
    alertesEmail: true,
    alertesNotification: true,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: Sauvegarder les paramètres
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>Modifiez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              value={settings.nom}
              onChange={(e) => setSettings({ ...settings, nom: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="devise">Devise par défaut</Label>
            <select
              id="devise"
              value={settings.devise}
              onChange={(e) => setSettings({ ...settings, devise: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleSave}>
              {saved ? "✓ Enregistré" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des loyers</CardTitle>
          <CardDescription>Configurez les paramètres de suivi des loyers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jourPaiement">Jour de paiement des loyers</Label>
            <select
              id="jourPaiement"
              value={settings.jourPaiement}
              onChange={(e) => setSettings({ ...settings, jourPaiement: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="1">1er du mois</option>
              <option value="2">2 du mois</option>
              <option value="3">3 du mois</option>
              <option value="4">4 du mois</option>
              <option value="5">5 du mois</option>
              <option value="6">6 du mois</option>
              <option value="7">7 du mois</option>
              <option value="8">8 du mois</option>
              <option value="9">9 du mois</option>
              <option value="10">10 du mois</option>
              <option value="15">15 du mois</option>
              <option value="20">20 du mois</option>
              <option value="25">25 du mois</option>
              <option value="30">30 du mois</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Le jour auquel vous attendez les loyers chaque mois
            </p>
          </div>

          <div>
            <Label htmlFor="delaiPaiement">Délai de paiement (jours)</Label>
            <Input
              id="delaiPaiement"
              type="number"
              value={settings.delaiPaiement}
              onChange={(e) => setSettings({ ...settings, delaiPaiement: e.target.value })}
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nombre de jours après lequel un loyer est considéré en retard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertesEmail"
              checked={settings.alertesEmail}
              onChange={(e) => setSettings({ ...settings, alertesEmail: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="alertesEmail" className="cursor-pointer">
              Recevoir des alertes par email pour les loyers en retard
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertesNotification"
              checked={settings.alertesNotification}
              onChange={(e) => setSettings({ ...settings, alertesNotification: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="alertesNotification" className="cursor-pointer">
              Afficher des notifications dans l'application
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
          <CardDescription>Informations sur l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Patrimoine Immo v1.0
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Application de gestion de patrimoine immobilier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
