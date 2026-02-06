import Stripe from 'stripe'

/**
 * Type strict pour les événements webhook Stripe gérés
 */
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'

/**
 * Types de plans disponibles
 */
export type PlanType = 'gratuit' | 'essentiel' | 'premium'

/**
 * Paramètres pour créer une session checkout
 */
export interface CreateCheckoutParams {
  priceId: string
  userId: string
  successUrl?: string
  cancelUrl?: string
}

/**
 * Paramètres pour créer une session portal
 */
export interface CreatePortalParams {
  customer: string
  return_url?: string
}

/**
 * Réponse de création de session (checkout ou portal)
 */
export interface SessionResponse {
  url: string
  sessionId?: string
}

/**
 * Réponse d'erreur API
 */
export interface ErrorResponse {
  error: string
}

/**
 * Type guard pour vérifier si un événement est géré
 */
export function isSupportedWebhookEvent(
  eventType: string
): eventType is StripeWebhookEvent {
  const supported: StripeWebhookEvent[] = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_failed',
    'invoice.payment_succeeded',
  ]
  return supported.includes(eventType as StripeWebhookEvent)
}

/**
 * Mapper priceId vers planType
 */
export function mapPriceIdToPlan(priceId: string): 'essentiel' | 'premium' | null {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) {
    return 'essentiel'
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) {
    return 'premium'
  }
  return null
}

/**
 * Mapper planType vers limites de biens
 */
export function getPlanLimits(planType: PlanType): number | null {
  const limits: Record<PlanType, number | null> = {
    gratuit: 2,
    essentiel: 10,
    premium: null, // illimité
  }
  return limits[planType]
}

/**
 * Type pour les statuts d'abonnement
 */
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'unpaid' 
  | 'payment_failed' 
  | 'trialing' 
  | null

/**
 * Données de profil liées à Stripe
 */
export interface StripeProfileData {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  plan_type: PlanType
}

/**
 * Payload d'événement checkout.session.completed
 */
export interface CheckoutCompletedPayload {
  session: Stripe.Checkout.Session
  customerId: string
  subscriptionId: string
  userId: string
}

/**
 * Payload d'événement invoice
 */
export interface InvoicePayload {
  invoice: Stripe.Invoice
  customerId: string
  attemptCount: number
}

/**
 * Type pour les metadata Stripe (documentation)
 * Note: Utiliser Record<string, string> dans les appels API Stripe
 */
export interface CheckoutMetadata {
  userId: string
  priceId?: string
  planType?: PlanType
}
