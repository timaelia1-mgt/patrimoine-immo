/**
 * Source de vérité unique pour tous les événements analytics
 */
export const ANALYTICS_EVENTS = {
  // Auth
  SIGNUP: 'signup',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Biens
  BIEN_CREATED: 'bien_created',
  BIEN_UPDATED: 'bien_updated',
  BIEN_DELETED: 'bien_deleted',
  BIEN_LIMIT_REACHED: 'bien_limit_reached',
  
  // Documents
  QUITTANCE_GENERATED: 'quittance_generated',
  QUITTANCE_SENT: 'quittance_sent',
  EXPORT_EXCEL: 'export_excel',
  EXPORT_PDF: 'export_pdf',
  IMPORT_CSV: 'import_csv',
  
  // Stripe / Abonnement
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  PLAN_UPGRADED: 'plan_upgraded',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  PORTAL_OPENED: 'portal_opened',
  
  // Performance
  WEB_VITAL: 'web_vital',
  ERROR: 'error',
} as const

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

/**
 * Propriétés typées par événement
 */
export interface EventProperties {
  // Biens
  bien_created: {
    planType: string
    bienCount: number
    type?: string
  }
  bien_limit_reached: {
    planType: string
    currentCount: number
    maxCount: number
  }
  
  // Stripe
  checkout_started: {
    planType: string
    priceId: string
  }
  payment_succeeded: {
    planType: string
    amount: number
  }
  plan_upgraded: {
    fromPlan: string
    toPlan: string
  }
  
  // Documents
  import_csv: {
    count: number
    planType: string
  }
  export_excel: {
    bienCount: number
  }
  
  // Performance
  web_vital: {
    name: 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    delta: number
    id: string
    navigationType?: string
  }
  error: {
    message: string
    stack?: string
    componentStack?: string
    filename?: string
    lineno?: number
    colno?: number
    errorType: 'react_error' | 'global_error' | 'unhandled_rejection'
  }
}
