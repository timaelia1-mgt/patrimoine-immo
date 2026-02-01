"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Lock, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      // Succès → Afficher message puis rediriger
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)

    } catch (error: any) {
      setError(error.message || "Erreur lors de la réinitialisation")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Mot de passe mis à jour !</CardTitle>
          <CardDescription className="mt-2">
            Redirection vers le dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Définissez votre nouveau mot de passe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Nouveau mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={8}
              required
              disabled={loading}
              className="bg-slate-50 dark:bg-slate-900/50"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minimum 8 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
              className="bg-slate-50 dark:bg-slate-900/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Définir le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
