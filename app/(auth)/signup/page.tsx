"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Lock, Mail } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validations
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    try {
      // Signup avec email + password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      })

      if (error) throw error

      // Redirection vers verify-otp avec l'email et type=signup
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}&type=signup`)
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Inscription</CardTitle>
        <CardDescription>
          Créez votre compte Patrimo gratuitement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              placeholder="Minimum 8 caractères"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
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
              placeholder="Répétez le mot de passe"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              disabled={loading}
              className="bg-slate-50 dark:bg-slate-900/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Un code de vérification vous sera envoyé par email après l'inscription
          </p>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
