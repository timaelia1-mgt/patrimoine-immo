import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import type { 
  CreateCheckoutParams, 
  SessionResponse,
  ErrorResponse,
} from '@/lib/types/stripe'
import { mapPriceIdToPlan } from '@/lib/types/stripe'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest): Promise<NextResponse<SessionResponse | ErrorResponse>> {
  try {
    const body = await request.json() as CreateCheckoutParams
    const { priceId, userId, successUrl, cancelUrl } = body

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID et User ID requis' },
        { status: 400 }
      )
    }

    // Instancier Stripe dans la fonction pour éviter le crash au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })

    // Récupérer le profil pour réutiliser le customer existant
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    // Résoudre le customer ID : vérifier l'existant ou en créer un nouveau
    let customerId: string | null = profile?.stripe_customer_id || null

    if (customerId) {
      // Vérifier que le customer existe dans l'environnement Stripe actuel
      // (gère le cas test → prod où l'ID test n'existe pas en prod)
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId)
        if (existingCustomer.deleted) {
          logger.warn('[Create Checkout] Customer Stripe supprimé, création nouveau customer', { 
            oldCustomerId: customerId, userId: user.id 
          })
          customerId = null
        }
      } catch {
        logger.warn('[Create Checkout] Customer ID invalide (probablement test→prod), création nouveau customer', { 
          oldCustomerId: customerId, userId: user.id 
        })
        customerId = null
      }
    }

    // Si pas de customer valide, en créer un nouveau
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      logger.info('[Create Checkout] Nouveau customer Stripe créé', { 
        customerId, userId: user.id 
      })

      // Mettre à jour le profil avec le nouveau customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        logger.error('[Create Checkout] Erreur mise à jour stripe_customer_id', { updateError })
        // On continue quand même, le webhook mettra à jour aussi
      }
    }

    // Créer la session Stripe Checkout avec le customer résolu
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })

    // Track checkout started
    const planType = mapPriceIdToPlan(priceId) || 'unknown'

    trackServerEvent(userId, ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      planType,
      priceId,
      sessionId: session.id,
    })

    logger.info('[Create Checkout] Session créée et trackée', {
      sessionId: session.id,
      userId,
      priceId,
      planType,
      customerId,
    })

    return NextResponse.json({ 
      url: session.url!,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const error = err as Error
    logger.error('[Create Checkout] Erreur:', { error: error.message })
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
