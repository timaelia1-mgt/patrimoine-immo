import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[create-checkout] Request body reçu:', body)
    
    const { priceId, userId } = body
    console.log('[create-checkout] priceId:', priceId)
    console.log('[create-checkout] userId:', userId)

    if (!priceId || !userId) {
      console.error('[create-checkout] Paramètres manquants:', { priceId, userId })
      return NextResponse.json(
        { error: 'Price ID et User ID requis' },
        { status: 400 }
      )
    }

    // Instancier Stripe dans la fonction pour éviter le crash au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    })

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Erreur Stripe Checkout:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
