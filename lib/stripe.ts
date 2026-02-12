import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'

// Export du type Stripe côté client
export type { StripeJS }

// Instance Stripe côté client (lazy loading)
let stripePromise: ReturnType<typeof loadStripe>

/**
 * Récupère l'instance Stripe côté client
 * Utilise le pattern singleton pour éviter de créer plusieurs instances
 * @returns Promise avec l'instance Stripe ou null si non disponible
 * @example
 * const stripe = await getStripe()
 * if (stripe) {
 *   await stripe.redirectToCheckout({ sessionId })
 * }
 */
export const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

/**
 * Type pour la configuration d'un plan d'abonnement
 */
export interface PlanConfig {
  /** Nom affiché du plan */
  name: string
  /** Prix mensuel en euros */
  price: number
  /** ID du prix Stripe (null pour le plan gratuit) */
  priceId: string | null
  /** Nombre maximum de biens (null = illimité) */
  maxBiens: number | null
  /** Liste des fonctionnalités incluses */
  features: readonly string[]
}

/**
 * Configuration des plans d'abonnement
 * Source de vérité unique pour tous les plans
 */
export const PLANS = {
  gratuit: {
    name: 'Gratuit',
    price: 0,
    priceId: null,
    maxBiens: 2,
    features: [
      'Jusqu\'à 2 biens immobiliers',
      'Calculs de rentabilité de base',
      'Suivi des loyers',
      'Export PDF basique',
    ],
  },
  essentiel: {
    name: 'Essentiel',
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL ?? null,
    maxBiens: 10,
    features: [
      'Jusqu\'à 10 biens immobiliers',
      'Calculs de rentabilité avancés',
      'Suivi des loyers et charges',
      'Génération de quittances PDF',
      'Export Excel/PDF complet',
      'Support email',
    ],
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM ?? null,
    maxBiens: null, // illimité
    features: [
      'Biens immobiliers illimités',
      'Tous les calculs avancés',
      'Gestion multi-locataires',
      'Historique complet',
      'Rapports personnalisés',
      'Export illimité',
      'Support prioritaire',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  },
} as const

/** Types de plans disponibles */
export type PlanType = keyof typeof PLANS

/**
 * Vérifie si une chaîne est un type de plan valide
 * @param plan - Chaîne à vérifier
 * @returns true si le plan est valide ('gratuit', 'essentiel' ou 'premium')
 * @example
 * isValidPlanType('essentiel') // true
 * isValidPlanType('invalid') // false
 */
export function isValidPlanType(plan: string): plan is PlanType {
  return plan === 'gratuit' || plan === 'essentiel' || plan === 'premium'
}

/**
 * Récupère les détails complets d'un plan
 * @param planType - Type de plan
 * @returns Configuration complète du plan
 * @example
 * const details = getPlanDetails('essentiel')
 * console.log(details.price) // 9.99
 * console.log(details.maxBiens) // 10
 */
export function getPlanDetails(planType: PlanType): typeof PLANS[PlanType] {
  return PLANS[planType] ?? PLANS['gratuit']
}

/**
 * Récupère la limite de biens pour un plan
 * @param planType - Type de plan
 * @returns Nombre max de biens ou null si illimité
 * @example
 * getPlanMaxBiens('gratuit') // 2
 * getPlanMaxBiens('premium') // null (illimité)
 */
export function getPlanMaxBiens(planType: PlanType): number | null {
  const plan = PLANS[planType]
  if (!plan) return 2 // Only fallback if plan doesn't exist
  return plan.maxBiens // Can be null for premium
}

/**
 * Vérifie si un utilisateur peut ajouter un nouveau bien
 * @param planType - Type de plan de l'utilisateur
 * @param currentBiensCount - Nombre de biens actuels
 * @returns true si l'utilisateur peut ajouter un bien
 * @example
 * canAddBien('gratuit', 1) // true (1 < 2)
 * canAddBien('gratuit', 2) // false (2 >= 2)
 * canAddBien('premium', 100) // true (illimité)
 */
export function canAddBien(planType: PlanType, currentBiensCount: number): boolean {
  const plan = PLANS[planType]
  if (!plan) return currentBiensCount < 2 // Fallback only if invalid plan
  const maxBiens = plan.maxBiens
  if (maxBiens === null) return true // illimité
  return currentBiensCount < maxBiens
}

/**
 * Récupère le Price ID Stripe d'un plan payant
 * @param planType - Type de plan (essentiel ou premium)
 * @returns Price ID Stripe ou null si non configuré
 * @example
 * getPriceId('essentiel') // 'price_xxx'
 */
export function getPriceId(planType: Exclude<PlanType, 'gratuit'>): string | null {
  return PLANS[planType]?.priceId ?? null
}

/**
 * Récupère le nombre de biens restants pour un plan
 * @param planType - Type de plan de l'utilisateur
 * @param currentBiensCount - Nombre de biens actuels
 * @returns Nombre de biens restants ou null si illimité
 * @example
 * getRemainingBiens('gratuit', 1) // 1
 * getRemainingBiens('premium', 100) // null (illimité)
 */
export function getRemainingBiens(planType: PlanType, currentBiensCount: number): number | null {
  const plan = PLANS[planType]
  if (!plan) return Math.max(0, 2 - currentBiensCount) // Fallback only if invalid
  const maxBiens = plan.maxBiens
  if (maxBiens === null) return null // illimité
  return Math.max(0, maxBiens - currentBiensCount)
}
