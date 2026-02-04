import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
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
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[Webhook] Event received:', event.type)

    // Gérer les différents types d'événements
    switch (event.type) {
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

        // Déterminer le plan selon le priceId
        let planType: 'essentiel' | 'premium' = 'essentiel'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) {
          planType = 'premium'
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) {
          planType = 'essentiel'
        }

        console.log('[Webhook] Updating user:', userId, 'to plan:', planType)

        // Mettre à jour le profil dans Supabase
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: planType,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
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

        // Déterminer le nouveau plan
        const priceId = subscription.items.data[0]?.price.id
        let planType: 'essentiel' | 'premium' = 'essentiel'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) {
          planType = 'premium'
        }

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

        // Rétrograder au plan gratuit
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: 'decouverte',
            stripe_subscription_id: null,
          })
          .eq('id', profile.id)

        if (error) {
          console.error('[Webhook] Error downgrading plan:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('[Webhook] User downgraded to Découverte')
        break
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
