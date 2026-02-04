"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { sanitizeAuthError } from "@/lib/auth-errors"
import { useAuth } from "@/lib/auth-context"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"
import { toast } from "sonner"
import { AlertCircle, Lock, Mail, KeyRound } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  
  // Mode Password
  const [passwordForm, setPasswordForm] = useState({ email: "", password: "" })
  
  // Mode OTP
  const [otpForm, setOtpForm] = useState({ email: "" })

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: passwordForm.email,
        password: passwordForm.password
      })

      if (error) throw error

      // Vérifier si l'email est confirmé
      if (data.user && !data.user.email_confirmed_at) {
        setError("Email non vérifié. Vérifiez votre boîte mail pour confirmer votre compte.")
        setLoading(false)
        return
      }

      toast.success('Connexion réussie !', {
        description: 'Redirection en cours...'
      })

      // Redirection directe vers dashboard
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(sanitizeAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation email côté client
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(otpForm.email)) {
        setError("Format d'email invalide")
        setLoading(false)
        return
      }

      // Appel API avec rate limiting
      const response = await fetchWithTimeout('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpForm.email, type: 'login' })
      }, 10000)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code')
      }

      toast.success('Code envoyé !', {
        description: 'Vérifiez votre boîte mail'
      })

      // Redirection vers verify-otp avec type=login
      router.push(`/verify-otp?email=${encodeURIComponent(otpForm.email)}&type=login`)
    } catch (error: unknown) {
      setError(sanitizeAuthError(error))
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

  return (
    <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte Patrimo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(v: string) => {
          setMode(v as 'password' | 'otp')
          setError(null)
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="password" className="flex items-center gap-2" aria-label="Se connecter avec mot de passe">
              <Lock className="w-4 h-4" aria-hidden="true" />
              Mot de passe
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex items-center gap-2" aria-label="Se connecter avec code par email">
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              Code par email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="space-y-4 mt-0">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {error && (
                <>
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
                  {error.includes('mot de passe') && (
                    <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                      <Link href="/forgot-password" className="text-sky-500 hover:text-sky-600 underline">
                        Mot de passe oublié ?
                      </Link>
                    </p>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Email
                </Label>
                <Input
                  id="password-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={passwordForm.email}
                  onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-50 dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-50 dark:bg-slate-900/50"
                />
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
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="text-center">
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-sky-500 hover:text-sky-600 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="otp" className="space-y-4 mt-0">
            <form onSubmit={handleOtpLogin} className="space-y-4">
              {error && (
                <>
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
                  {error.includes('mot de passe') && (
                    <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                      <Link href="/forgot-password" className="text-sky-500 hover:text-sky-600 underline">
                        Mot de passe oublié ?
                      </Link>
                    </p>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Email
                </Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={otpForm.email}
                  onChange={(e) => setOtpForm({ email: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-50 dark:bg-slate-900/50"
                />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Un code de vérification vous sera envoyé par email
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
                  "Recevoir un code"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-sky-500 hover:text-sky-600 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
