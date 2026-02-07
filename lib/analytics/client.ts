'use client'

import posthog from 'posthog-js'
import type { AnalyticsEvent } from './events'

/**
 * Track un événement côté client
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  
  try {
    posthog.capture(event, properties)
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error)
  }
}

/**
 * Identifie un utilisateur
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  
  try {
    posthog.identify(userId, properties)
  } catch (error) {
    console.error('[Analytics] Error identifying user:', error)
  }
}

/**
 * Reset l'identité (logout)
 */
export function resetUser(): void {
  if (typeof window === 'undefined') return
  
  try {
    posthog.reset()
  } catch (error) {
    console.error('[Analytics] Error resetting user:', error)
  }
}

/**
 * Définit des propriétés globales pour tous les événements
 */
export function setSuperProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  
  try {
    posthog.register(properties)
  } catch (error) {
    console.error('[Analytics] Error setting super properties:', error)
  }
}
