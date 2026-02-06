import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { 
  isSupportedWebhookEvent, 
  mapPriceIdToPlan 
} from '@/lib/types/stripe'
import type { 
  StripeWebhookEvent,
  SubscriptionStatus,
  ErrorResponse 
} from '@/lib/types/stripe'

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
      console.error('[Webhook] No signature provided')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const error = err as Error
      console.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[Webhook] Event received:', event.type, event.id)

    // Type guard pour événements supportés
    if (!isSupportedWebhookEvent(event.type)) {
      console.log('[Webhook] Unhandled event type:', event.type)
      return NextResponse.json({ received: true, ignored: true })
    }

    // Maintenant TypeScript sait que event.type est StripeWebhookEvent
    const eventType = event.type as StripeWebhookEvent

    // Gérer les différents types d'événements
    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[Webhook] Checkout completed:', session.id)

        // Récupérer l'userId depuis les metadata
        const userId = session.client_reference_id || session.metadata?.userId

        if (!userId) {
          console.error('[Webhook] No userId found in session')
          return NextResponse.json({ error: 'No userId' }, { status: 400 })
        }

        // Récupérer la subscription
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!subscriptionId) {
          console.error('[Webhook] No subscription found')
          return NextResponse.json({ error: 'No subscription' }, { status: 400 })
        }

        // Récupérer les détails de la subscription pour connaître le plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        // Déterminer le plan selon le priceId avec type guard
        const planType = mapPriceIdToPlan(priceId) || 'essentiel'
        const subscriptionStatus: SubscriptionStatus = 'active'

        console.log('[Webhook] Updating user:', userId, 'to plan:', planType)

        // Mettre à jour le profil dans Supabase
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: planType,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscriptionStatus,
          })
          .eq('id', userId)

        if (error) {
          console.error('[Webhook] Error updating profile:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('[Webhook] Profile updated successfully')
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[Webhook] Subscription updated:', subscription.id)

        // Trouver l'utilisateur par stripe_customer_id
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError || !profile) {
          console.error('[Webhook] Profile not found for customer:', subscription.customer)
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Déterminer le nouveau plan avec type guard
        const priceId = subscription.items.data[0]?.price.id
        const planType = mapPriceIdToPlan(priceId) || 'essentiel'

        // Mettre à jour le plan
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ plan_type: planType })
          .eq('id', profile.id)

        if (error) {
          console.error('[Webhook] Error updating plan:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('[Webhook] Plan updated successfully')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[Webhook] Subscription cancelled:', subscription.id)

        // Trouver l'utilisateur
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError || !profile) {
          console.error('[Webhook] Profile not found')
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const canceledStatus: SubscriptionStatus = 'canceled'

        // Rétrograder au plan gratuit
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: 'gratuit',
            stripe_subscription_id: null,
            subscription_status: canceledStatus,
          })
          .eq('id', profile.id)

        if (error) {
          console.error('[Webhook] Error downgrading plan:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('[Webhook] User downgraded to Gratuit')
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        console.log('[Webhook] Payment failed for customer:', customerId)

        if (!customerId) {
          console.error('[Webhook] No customer ID in invoice')
          break
        }

        // Récupérer l'utilisateur par customer_id
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profileError || !profile) {
          console.error('[Webhook] Profile not found for customer:', customerId)
          break
        }

        const attemptCount = invoice.attempt_count ?? 0

        console.warn('[Webhook] Payment failed:', {
          userId: profile.id,
          email: profile.email,
          invoiceId: invoice.id,
          amountDue: invoice.amount_due,
          attemptCount,
        })

        const failedStatus: SubscriptionStatus = 'payment_failed'

        // Si c'est le 3ème échec ou plus, rétrograder vers gratuit
        if (attemptCount >= 3) {
          console.error('[Webhook] 3+ payment failures - Downgrading user:', profile.id)

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              plan_type: 'gratuit',
              subscription_status: failedStatus,
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('[Webhook] Error downgrading user:', updateError)
          } else {
            console.log('[Webhook] User downgraded due to payment failure:', profile.id)
          }
        } else {
          // Mettre à jour le statut sans rétrograder encore
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: failedStatus,
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('[Webhook] Error updating subscription status:', updateError)
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('[Webhook] Payment succeeded for customer:', customerId)

        if (!customerId) break

        // Récupérer l'utilisateur
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, email, subscription_status')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log('[Webhook] Payment confirmed:', {
            userId: profile.id,
            email: profile.email,
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
              })
              .eq('id', profile.id)

            if (!error) {
              console.log('[Webhook] Subscription status restored to active:', profile.id)
            }
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const error = err as Error
    console.error('[Webhook] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
