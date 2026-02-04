import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email et type requis' },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    // Rate limiting : 3 tentatives par 15 minutes
    const rateLimitResult = rateLimit(`otp:${email}`, {
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000 // 15 minutes
    })

    if (!rateLimitResult.success) {
      const minutesLeft = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).` },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    if (type === 'login') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (error) {
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi du code' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      remaining: rateLimitResult.remaining
    })
  } catch (error: unknown) {
    logger.error('[API] Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
