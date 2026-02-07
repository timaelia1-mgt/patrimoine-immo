'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { trackEvent } from './client'
import { ANALYTICS_EVENTS } from './events'
import { useWebVitals } from './web-vitals'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Track Web Vitals
  useWebVitals()

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

    if (!apiKey) {
      console.warn('[Analytics] PostHog API key not found')
      return
    }

    posthog.init(apiKey, {
      api_host: host,
      person_profiles: 'identified_only', // RGPD: seulement les users identifiés
      capture_pageview: true, // Auto-capture pageviews
      capture_pageleave: true, // Track quand l'utilisateur quitte
      persistence: 'localStorage', // Pas de cookies
      autocapture: false, // Désactiver l'autocapture (on track manuellement)
      disable_session_recording: true, // Désactiver session replay (privacy)
    })

    // Track erreurs globales (non-React)
    const handleError = (event: ErrorEvent) => {
      trackEvent(ANALYTICS_EVENTS.ERROR, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.substring(0, 500),
        errorType: 'global_error',
      })
    }

    // Track promesses rejetées non catchées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackEvent(ANALYTICS_EVENTS.ERROR, {
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack?.substring(0, 500),
        errorType: 'unhandled_rejection',
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
