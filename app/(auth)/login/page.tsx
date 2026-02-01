"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Lock, Mail, KeyRound } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mode Password
  const [passwordForm, setPasswordForm] = useState({ email: "", password: "" })
  
  // Mode OTP
  const [otpForm, setOtpForm] = useState({ email: "" })

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

      // Redirection directe vers dashboard
      window.location.href = '/dashboard'
    } catch (error: any) {
      setError(error.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpForm.email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (error) throw error

      // Redirection vers verify-otp avec type=login
      router.push(`/verify-otp?email=${encodeURIComponent(otpForm.email)}&type=login`)
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'envoi du code')
    } finally {
      setLoading(false)
    }
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
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Mot de passe
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Code par email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="space-y-4 mt-0">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
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
                  <Lock className="w-4 h-4" />
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
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp" className="space-y-4 mt-0">
            <form onSubmit={handleOtpLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Un code de vérification vous sera envoyé par email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Recevoir un code"}
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
