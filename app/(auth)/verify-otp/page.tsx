'use client'

import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { sanitizeAuthError } from '@/lib/auth-errors'
import { useAuth } from '@/lib/auth-context'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const rawType = searchParams?.get('type')
  const type: 'signup' | 'login' = rawType === 'login' ? 'login' : 'signup'
  
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Focus management sur les erreurs
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [error])

  // États pour le bouton "Renvoyer"
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Timer d'expiration du code (10 minutes)
  const [timeLeft, setTimeLeft] = useState(600)

  // Redirection si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  // Timer principal (expiration du code)
  useEffect(() => {
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  // Cooldown du bouton renvoyer
  useEffect(() => {
    if (resendCooldown <= 0) return

    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: type === 'signup' ? 'signup' : 'email'
      })

      if (error) throw error

      toast.success('Email vérifié !', {
        description: 'Accès à votre compte...'
      })

      // Succès → Dashboard
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(sanitizeAuthError(error))
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      if (type === 'login') {
        // Pour login, utiliser l'API route
        const response = await fetchWithTimeout('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type: 'login' })
        }, 10000)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error)
        }
      } else {
        // Pour signup, réenvoyer le code via Supabase
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        })

        if (error) throw error
      }

      setResendSuccess(true)
      setResendCooldown(60) // 60 secondes de cooldown
      setTimeLeft(600) // Reset le timer à 10 minutes
    } catch (error: unknown) {
      setError(sanitizeAuthError(error))
    } finally {
      setResendLoading(false)
    }
  }

  // Afficher un loader pendant la vérification
  if (authLoading) {
    return (
      <Card className="w-full max-w-md border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
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
    <Card className="w-full max-w-md border-0 shadow-large bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Vérification</CardTitle>
        <CardDescription>
          Entrez le code reçu par email à <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
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

          {resendSuccess && (
            <div 
              role="status" 
              aria-live="polite"
              className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Nouveau code envoyé ! Vérifiez votre boîte mail.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={loading}
              maxLength={6}
              className="text-center text-2xl tracking-widest bg-slate-50 dark:bg-slate-900/50"
              aria-label="Code de vérification à 6 chiffres"
              aria-describedby="otp-help"
            />
            <div id="otp-help" className="flex items-center justify-between text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                {type === 'signup' 
                  ? 'Code de confirmation envoyé par email'
                  : 'Code de connexion envoyé par email'}
              </p>
              {timeLeft > 0 ? (
                <p className="text-slate-700 dark:text-slate-200 font-medium">
                  Expire dans {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Code expiré
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg"
            disabled={loading || otp.length !== 6}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                Vérification...
              </span>
            ) : (
              'Vérifier'
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="text-sm"
              aria-busy={resendLoading}
            >
              {resendLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-slate-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  Envoi...
                </span>
              ) : resendCooldown > 0 ? (
                `Renvoyer dans ${resendCooldown}s`
              ) : (
                'Renvoyer le code'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Suspense fallback={
        <Card className="w-full max-w-md border-0 shadow-large bg-white dark:bg-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <VerifyOtpForm />
      </Suspense>
    </div>
  )
}
