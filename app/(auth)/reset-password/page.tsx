"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { sanitizeAuthError } from "@/lib/auth-errors"
import { logger } from "@/lib/logger"
import { AlertCircle, Lock, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  // Focus management sur les erreurs
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [error])

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error("[ResetPassword] Erreur vérification session:", error)
          setError("Lien invalide ou expiré")
          setLoading(false)
          return
        }

        if (!session) {
          setError("Lien invalide ou expiré")
          setLoading(false)
          return
        }

        setSessionValid(true)
      } catch (err: unknown) {
        logger.error("[ResetPassword] Erreur lors de la vérification:", err)
        setError("Lien invalide ou expiré")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase])

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Le mot de passe doit contenir au moins 8 caractères")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une majuscule")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une minuscule")
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un chiffre")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (!formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs")
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0])
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      // Succès
      setSuccess(true)

      // Redirection après 2 secondes
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: unknown) {
      setError(sanitizeAuthError(error))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardContent className="py-12">
          <div className="text-center" role="status" aria-live="polite">
            <div 
              className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"
              aria-hidden="true"
            ></div>
            <p className="text-slate-600 dark:text-slate-400">Vérification du lien...</p>
            <span className="sr-only">Vérification du lien de réinitialisation en cours</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessionValid || error && !submitting) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display">Lien invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation est invalide ou a expiré
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div 
                ref={errorRef}
                tabIndex={-1}
                role="alert" 
                aria-live="polite"
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {error}
              </div>
            )}
            <Button
              asChild
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            >
              <a href="/forgot-password">
                Demander un nouveau lien
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-display">Mot de passe réinitialisé !</CardTitle>
          <CardDescription className="mt-2">
            Votre mot de passe a été modifié avec succès
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Vous allez être redirigé vers la page de connexion dans quelques instants...
            </p>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            >
              <a href="/login">
                Aller à la connexion
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé
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
              <Lock className="w-4 h-4" aria-hidden="true" />
              Nouveau mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 caractères"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={submitting}
              className="bg-slate-50 dark:bg-slate-900/50"
              aria-describedby="password-requirements-reset"
            />
            <p id="password-requirements-reset" className="text-xs text-slate-600 dark:text-slate-300">
              Au moins 8 caractères, une majuscule, une minuscule et un chiffre
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
              <Lock className="w-4 h-4" aria-hidden="true" />
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Répétez le mot de passe"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={submitting}
              className="bg-slate-50 dark:bg-slate-900/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                Réinitialisation...
              </span>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
