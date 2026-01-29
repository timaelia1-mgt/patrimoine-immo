'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function VerifyOtpForm() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  
  const supabase = createClient()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) throw error

      window.location.href = '/dashboard'
    } catch (error: any) {
      setError(error.message || 'Code invalide')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-large bg-white dark:bg-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-display">Vérification</CardTitle>
        <CardDescription>
          Entrez le code reçu par email à {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 text-white"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </Button>
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
