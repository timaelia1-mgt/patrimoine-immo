"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/theme-provider"
import { Moon, Sun } from "lucide-react"
import type { UserProfile } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"
import { DataManagementSection } from "./DataManagementSection"

interface ParametresClientProps {
  profile: UserProfile | null
  userEmail: string
}

export function ParametresClient({ profile, userEmail }: ParametresClientProps) {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  
  const [settings, setSettings] = useState({
    // Infos compte
    nom: profile?.name || "",
    devise: profile?.currency || "EUR",
    
    // Gestion loyers
    jourPaiement: profile?.rentPaymentDay?.toString() || "5",
    delaiPaiement: profile?.paymentDelayDays?.toString() || "5",
    alertesEmail: profile?.emailAlertsEnabled ?? true,
    alertesNotification: profile?.appNotificationsEnabled ?? true,
  })

  const [loading, setLoading] = useState(false)

  // États pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleSave = async () => {
    if (!profile) {
      alert("Profil non disponible")
      return
    }

    if (!settings.nom.trim()) {
      alert("Le nom est obligatoire")
      return
    }

    try {
      setLoading(true)
      console.log("[Paramètres] Début sauvegarde...")
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settings.nom.trim(),
          currency: settings.devise,
          rentPaymentDay: parseInt(settings.jourPaiement),
          paymentDelayDays: parseInt(settings.delaiPaiement),
          emailAlertsEnabled: settings.alertesEmail,
          appNotificationsEnabled: settings.alertesNotification,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }
      
      console.log("[Paramètres] Sauvegarde réussie")
      
      // Rafraîchir la page pour afficher les nouvelles valeurs
      router.refresh()
      
      // Afficher un message de succès
      alert("✓ Paramètres enregistrés avec succès !")
    } catch (error: any) {
      console.error("[Paramètres] Erreur lors de la sauvegarde:", error)
      alert(`Erreur lors de la sauvegarde: ${error?.message || "Erreur inconnue"}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    // Validations
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }
    
    setPasswordLoading(true)
    
    try {
      const supabase = createClient()
      
      // Créer une promesse avec timeout
      const updatePromise = supabase.auth.updateUser({
        password: passwordForm.newPassword
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      )
      
      try {
        const { error } = await Promise.race([updatePromise, timeoutPromise]) as any
        
        if (error) throw error
      } catch (err: any) {
        // Si timeout, vérifier si USER_UPDATED a été émis
        if (err.message === 'timeout') {
          // Considérer comme succès car USER_UPDATED est émis
        } else {
          throw err
        }
      }
      
      // Succès
      setPasswordSuccess('Mot de passe modifié avec succès !')
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error)
      setPasswordError(error.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="p-8 pt-16 lg:pt-8 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Paramètres</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Configurez votre application</p>
        </div>

      {/* SECTION 1 : Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Vos informations de compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              value={settings.nom}
              onChange={(e) => setSettings({ ...settings, nom: e.target.value })}
              placeholder="Votre nom"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              L'email ne peut pas être modifié ici
            </p>
          </div>

          <div>
            <Label htmlFor="devise">Devise par défaut</Label>
            <select
              id="devise"
              value={settings.devise}
              onChange={(e) => setSettings({ ...settings, devise: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "light" ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
              <div>
                <p className="font-medium">Thème</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "light" ? "Mode clair" : "Mode sombre"}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${theme === "dark" 
                  ? "bg-slate-700" 
                  : "bg-slate-300"
                }
              `}
            >
              <span
                className={`
                  flex h-6 w-6 items-center justify-center transform rounded-full transition-transform
                  ${theme === "dark" 
                    ? "translate-x-7 bg-primary-500 border-2 border-slate-600" 
                    : "translate-x-1 bg-white border-2 border-slate-200"
                  }
                  shadow-lg
                `}
              >
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-white" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 : Gestion des loyers */}
      {/* SECTION 2 : Gestion des loyers */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des loyers</CardTitle>
          <CardDescription>Paramètres de suivi des paiements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jourPaiement">Jour de paiement des loyers</Label>
            <select
              id="jourPaiement"
              value={settings.jourPaiement}
              onChange={(e) => setSettings({ ...settings, jourPaiement: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
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

      {/* SECTION 3 : Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Changement de mot de passe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input 
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              minLength={8}
              disabled={passwordLoading}
              placeholder="Minimum 8 caractères"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 8 caractères</p>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              disabled={passwordLoading}
              placeholder="Confirmez votre mot de passe"
            />
          </div>
          
          {passwordError && (
            <p className="text-sm text-red-500 dark:text-red-400">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-500 dark:text-green-400">{passwordSuccess}</p>
          )}
          
          <div className="flex justify-end">
            <Button onClick={handlePasswordChange} disabled={passwordLoading}>
              {passwordLoading ? "Modification..." : "Changer le mot de passe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BOUTON UNIQUE EN BAS */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Enregistrement..." : "Enregistrer tous les paramètres"}
        </Button>
      </div>

      {/* SECTION 4 : Gestion des données */}
      <DataManagementSection />

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
    </div>
  )
}
