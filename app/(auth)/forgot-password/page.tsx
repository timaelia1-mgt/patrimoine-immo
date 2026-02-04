"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { sanitizeAuthError } from "@/lib/auth-errors"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Mail, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  // Focus management sur les erreurs
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [error])

  // Redirection si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation email
    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email")
      return
    }

    if (!validateEmail(email)) {
      setError("Veuillez saisir une adresse email valide")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/reset-password`
          : undefined
      })

      if (error) throw error

      // Succès - afficher message générique pour éviter l'énumération
      setSuccess(true)
    } catch (error: unknown) {
      // Message générique pour éviter l'énumération d'emails
      setError("Si cet email existe, vous recevrez un lien de réinitialisation")
    } finally {
      setLoading(false)
    }
  }

  // Afficher un loader pendant la vérification
  if (authLoading) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardContent className="py-12">
          <div className="text-center" role="status" aria-live="polite">
            <div 
              className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"
              aria-hidden="true"
            ></div>
            <p className="text-slate-600 dark:text-slate-400">Vérification...</p>
            <span className="sr-only">Vérification de votre session en cours</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ne rien afficher si l'utilisateur est connecté (la redirection est en cours)
  if (user) {
    return null
  }

  if (success) {
    return (
      <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-display">Email envoyé !</CardTitle>
          <CardDescription className="mt-2">
            Si un compte existe avec cet email, vous recevrez un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </p>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            >
              <Link href="/login">
                Retour à la connexion
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-slate-50 dark:bg-slate-900/50"
            />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Vous recevrez un lien pour réinitialiser votre mot de passe
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                Envoi en cours...
              </span>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
