import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set(name, value, options)
              )
            } catch {
              // setAll peut échouer dans un Route Handler en lecture seule
              // C'est OK, le middleware gère le refresh des cookies
            }
          },
        },
      }
    )
    
    // Utiliser getUser() au lieu de getSession() pour :
    // 1. Valider le token côté serveur Supabase (pas juste lire le JWT)
    // 2. Rafraîchir automatiquement les tokens expirés
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ session: null })
    }
    
    // Si l'utilisateur est validé, récupérer la session complète
    const { data: { session } } = await supabase.auth.getSession()
    
    return NextResponse.json({ session })
  } catch (error) {
    console.error('[API /auth/session] Error:', error)
    return NextResponse.json({ session: null }, { status: 500 })
  }
}
