"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      })

      if (error) throw error

      // Rediriger vers la page de vérification
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      // Note: setLoading(false) pas nécessaire car on quitte la page
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false) // ✅ Garantit la réinitialisation
    }
  }

  return (
    <Card className="border-0 shadow-large bg-white dark:bg-slate-800">
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Un code de vérification vous sera envoyé par email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 text-white"
            disabled={loading}
          >
            {loading ? "Envoi en cours..." : "Recevoir le code"}
          </Button>
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
