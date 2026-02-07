import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import type { 
  SessionResponse, 
  ErrorResponse,
  CreatePortalParams 
} from '@/lib/types/stripe'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export async function POST(_request: NextRequest): Promise<NextResponse<SessionResponse | ErrorResponse>> {
  try {
    // Instancier Stripe dans la fonction pour éviter le crash au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })

    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le profil avec customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, plan_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé. Souscrivez d\'abord à un plan payant.' },
        { status: 400 }
      )
    }

    // Paramètres typés pour le portal
    const params: CreatePortalParams = {
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement`,
    }

    // Créer la session du Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create(params)

    // Track portal opened
    trackServerEvent(user.id, ANALYTICS_EVENTS.PORTAL_OPENED, {
      planType: profile.plan_type || 'gratuit',
      customerId: profile.stripe_customer_id!,
    })

    logger.info('[Create Portal] Session créée et trackée', {
      userId: user.id,
      customerId: profile.stripe_customer_id,
    })

    return NextResponse.json({ 
      url: portalSession.url,
      sessionId: portalSession.id,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
