import { PostHog } from 'posthog-node'
import type { AnalyticsEvent } from './events'

let posthogClient: PostHog | null = null

/**
 * Obtenir le client PostHog server-side (singleton)
 */
function getPostHogClient(): PostHog | null {
  if (posthogClient) return posthogClient

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

  if (!apiKey) {
    console.warn('[Analytics] PostHog API key not found')
    return null
  }

  posthogClient = new PostHog(apiKey, {
    host,
    flushAt: 1, // Envoyer immédiatement (important pour les webhooks)
    flushInterval: 0,
  })

  return posthogClient
}

/**
 * Track un événement côté serveur (API routes, webhooks)
 */
export function trackServerEvent(
  userId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): void {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId: userId,
      event,
      properties,
    })
  } catch (error) {
    console.error('[Analytics] Error tracking server event:', error)
  }
}

/**
 * Flush les événements en attente (appeler avant de terminer une serverless function)
 */
export async function flushAnalytics(): Promise<void> {
  const client = getPostHogClient()
  if (!client) return

  try {
    await client.shutdown()
    posthogClient = null // Reset pour permettre une nouvelle initialisation
  } catch (error) {
    console.error('[Analytics] Error flushing analytics:', error)
  }
}
