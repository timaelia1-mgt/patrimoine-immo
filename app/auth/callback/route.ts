import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    
    // Exchange le code pour une session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Erreur exchangeCodeForSession:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Lien invalide ou expiré')}`
      )
    }
    
    // Vérifier si c'est une récupération de password
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Rediriger vers reset-password
      return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
    }
  }

  // Fallback : redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
