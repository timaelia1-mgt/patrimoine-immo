import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { 
  CreateCheckoutParams, 
  SessionResponse,
  ErrorResponse,
} from '@/lib/types/stripe'

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
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ 
      url: session.url!,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
