import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { 
  isSupportedWebhookEvent, 
  mapPriceIdToPlan,
  getPlanLimits,
} from '@/lib/types/stripe'
import type { 
  StripeWebhookEvent,
  SubscriptionStatus,
  ErrorResponse 
} from '@/lib/types/stripe'
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { logger } from '@/lib/logger'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface WebhookResponse {
  received: boolean
  ignored?: boolean
}

export async function POST(req: Request): Promise<NextResponse<WebhookResponse | ErrorResponse>> {
  try {
    // Instancier Stripe dans la fonction pour éviter le crash au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })

    // Supabase admin client (pour bypasser RLS) - Créé DANS la fonction
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      logger.error('[Stripe Webhook] No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const error = err as Error
      logger.error('[Stripe Webhook] Signature verification failed', { error: error.message })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    logger.info('[Stripe Webhook] Event received', { type: event.type, id: event.id })

    // Type guard pour événements supportés
    if (!isSupportedWebhookEvent(event.type)) {
      logger.info('[Stripe Webhook] Unhandled event type', { type: event.type })
      return NextResponse.json({ received: true, ignored: true })
    }

    // Maintenant TypeScript sait que event.type est StripeWebhookEvent
    const eventType = event.type as StripeWebhookEvent

    // Gérer les différents types d'événements
    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        logger.info('[Stripe Webhook] Checkout completed', { sessionId: session.id })

        // Récupérer l'userId depuis les metadata
        const userId = session.client_reference_id || session.metadata?.userId

        if (!userId) {
          logger.error('[Stripe Webhook] No userId found in session')
          return NextResponse.json({ error: 'No userId' }, { status: 400 })
        }

        // Récupérer la subscription
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!subscriptionId) {
          logger.error('[Stripe Webhook] No subscription found')
          return NextResponse.json({ error: 'No subscription' }, { status: 400 })
        }

        // Récupérer les détails de la subscription pour connaître le plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const amount = subscription.items.data[0]?.price.unit_amount || 0

        // Déterminer le plan selon le priceId avec type guard
        const planType = mapPriceIdToPlan(priceId) || 'essentiel'
        const limiteBiens = getPlanLimits(planType)
        const subscriptionStatus: SubscriptionStatus = 'active'

        logger.info('[Stripe Webhook] Updating user to plan', { userId, planType })

        // Mettre à jour le profil dans Supabase
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: planType,
            limite_biens: limiteBiens,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscriptionStatus,
          })
          .eq('id', userId)

        if (error) {
          logger.error('[Stripe Webhook] Error updating profile', { error })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Track payment succeeded
        trackServerEvent(userId, ANALYTICS_EVENTS.PAYMENT_SUCCEEDED, {
          planType,
          amount: amount / 100,
          priceId,
          customerId,
          subscriptionId,
        })

        logger.info('[Stripe Webhook] Payment succeeded tracké', {
          userId,
          planType,
          amount: amount / 100,
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        logger.info('[Stripe Webhook] Subscription updated', { subscriptionId: subscription.id })

        // Trouver l'utilisateur par stripe_customer_id
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id, plan_type')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError || !profile) {
          logger.error('[Stripe Webhook] Profile not found', { customer: subscription.customer })
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Déterminer le nouveau plan avec type guard
        const priceId = subscription.items.data[0]?.price.id
        const newPlanType = mapPriceIdToPlan(priceId) || 'essentiel'
        const oldPlanType = profile.plan_type || 'gratuit'

        // Mettre à jour le plan
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: newPlanType,
            limite_biens: getPlanLimits(newPlanType),
            subscription_status: subscription.status as SubscriptionStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          logger.error('[Stripe Webhook] Error updating plan', { error })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Track plan upgraded (seulement si changement de plan)
        if (oldPlanType !== newPlanType) {
          trackServerEvent(profile.id, ANALYTICS_EVENTS.PLAN_UPGRADED, {
            fromPlan: oldPlanType,
            toPlan: newPlanType,
            amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
          })

          logger.info('[Stripe Webhook] Plan upgraded tracké', {
            userId: profile.id,
            fromPlan: oldPlanType,
            toPlan: newPlanType,
          })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        logger.info('[Stripe Webhook] Subscription cancelled', { subscriptionId: subscription.id })

        // Trouver l'utilisateur
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id, plan_type')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError || !profile) {
          logger.error('[Stripe Webhook] Profile not found', { customer: subscription.customer })
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const oldPlanType = profile.plan_type || 'gratuit'
        const canceledStatus: SubscriptionStatus = 'canceled'

        // Rétrograder au plan gratuit
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: 'gratuit',
            limite_biens: 2,
            stripe_subscription_id: null,
            subscription_status: canceledStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          logger.error('[Stripe Webhook] Error downgrading plan', { error })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Track subscription canceled
        trackServerEvent(profile.id, ANALYTICS_EVENTS.SUBSCRIPTION_CANCELED, {
          fromPlan: oldPlanType,
          toPlan: 'gratuit',
          cancellationReason: subscription.cancellation_details?.reason || 'unknown',
        })

        logger.info('[Stripe Webhook] Subscription canceled trackée', {
          userId: profile.id,
          fromPlan: oldPlanType,
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        logger.info('[Stripe Webhook] Payment failed', { customerId })

        if (!customerId) {
          logger.error('[Stripe Webhook] No customer ID in invoice')
          break
        }

        // Récupérer l'utilisateur par customer_id
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, plan_type')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profileError || !profile) {
          logger.error('[Stripe Webhook] Profile not found', { customerId })
          break
        }

        const attemptCount = invoice.attempt_count ?? 0

        // Track payment failed
        trackServerEvent(profile.id, ANALYTICS_EVENTS.PAYMENT_FAILED, {
          planType: profile.plan_type || 'unknown',
          amount: (invoice.amount_due || 0) / 100,
          attemptCount,
          invoiceId: invoice.id,
        })

        logger.warn('[Stripe Webhook] Payment failed tracké', {
          userId: profile.id,
          email: profile.email,
          attemptCount,
          amountDue: invoice.amount_due,
        })

        const failedStatus: SubscriptionStatus = 'payment_failed'

        // Si c'est le 3ème échec ou plus, rétrograder vers gratuit
        if (attemptCount >= 3) {
          logger.error('[Stripe Webhook] 3+ payment failures - Downgrading', { userId: profile.id })

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              plan_type: 'gratuit',
              limite_biens: 2,
              subscription_status: failedStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

          if (updateError) {
            logger.error('[Stripe Webhook] Error downgrading user', { updateError })
          } else {
            logger.info('[Stripe Webhook] User downgraded due to payment failure', { userId: profile.id })
          }
        } else {
          // Mettre à jour le statut sans rétrograder encore
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: failedStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

          if (updateError) {
            logger.error('[Stripe Webhook] Error updating subscription status', { updateError })
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        logger.info('[Stripe Webhook] Payment succeeded', { customerId })

        if (!customerId) break

        // Récupérer l'utilisateur
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, email, subscription_status, plan_type')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          logger.info('[Stripe Webhook] Payment confirmed', {
            userId: profile.id,
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
          })

          const activeStatus: SubscriptionStatus = 'active'

          // Si le statut était en échec, le restaurer à active
          if (profile.subscription_status === 'payment_failed') {
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({
                subscription_status: activeStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id)

            if (!error) {
              logger.info('[Stripe Webhook] Subscription status restored to active', { userId: profile.id })
            }
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const error = err as Error
    logger.error('[Stripe Webhook] Error', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
