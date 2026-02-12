import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/database'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const profile = await getUserProfile(user.id, supabase)
    
    return NextResponse.json({ profile })
  } catch (error: unknown) {
    logger.error('[API getUserProfile] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Mapping camelCase → snake_case pour Supabase
    const fieldMapping: Record<string, string> = {
      name: "name",
      plan: "plan_type",
      currency: "currency",
      rentPaymentDay: "rent_payment_day",
      paymentDelayDays: "payment_delay_days",
      emailAlertsEnabled: "email_alerts_enabled",
      appNotificationsEnabled: "app_notifications_enabled",
    }
    
    const updatesSnakeCase: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (key === "userId" || key === "id") continue
      const snakeKey = fieldMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
      updatesSnakeCase[snakeKey] = value
    }
    
    logger.info('[API updateProfile] Mise à jour profil:', { userId: user.id, fields: Object.keys(updatesSnakeCase) })
    
    const { data, error } = await supabase
      .from("profiles")
      .update(updatesSnakeCase)
      .eq("id", user.id)
      .select()
      .single()
    
    if (error) {
      logger.error('[API updateProfile] Erreur Supabase:', error)
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la mise à jour' },
        { status: 400 }
      )
    }
    
    if (!data) {
      logger.error('[API updateProfile] Aucune donnée retournée pour userId:', user.id)
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ profile: data })
  } catch (error: unknown) {
    logger.error('[API updateProfile] Erreur serveur:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
