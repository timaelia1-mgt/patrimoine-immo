import { loadStripe } from '@stripe/stripe-js'

// Stripe côté client uniquement
let stripePromise: ReturnType<typeof loadStripe>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Configuration des plans
export const PLANS = {
  decouverte: {
    name: 'Découverte',
    price: 0,
    priceId: null,
    maxBiens: 2,
    features: [
      '2 biens maximum',
      'Fonctionnalités de base',
      'Graphique patrimoine',
      'Support email',
    ],
  },
  essentiel: {
    name: 'Essentiel',
    price: 9,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL!,
    maxBiens: 5,
    features: [
      '5 biens maximum',
      'Toutes fonctionnalités avancées',
      'Quittances PDF',
      'Envoi email automatique',
      'Support prioritaire',
    ],
  },
  premium: {
    name: 'Premium',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM!,
    maxBiens: null, // illimité
    features: [
      'Biens illimités',
      'Toutes fonctionnalités avancées',
      'Quittances PDF illimitées',
      'Exports avancés',
      'Support premium 24/7',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS
