'use client'

import { useEffect } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

/**
 * Envoie une métrique Web Vitals à PostHog
 */
function sendToAnalytics(metric: Metric) {
  // Rating basé sur les seuils Web Vitals
  const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      // FID remplacé par INP dans web-vitals v4+
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
      INP: [200, 500],
    }

    const [good, poor] = thresholds[name] || [0, 0]
    if (value <= good) return 'good'
    if (value <= poor) return 'needs-improvement'
    return 'poor'
  }

  trackEvent(ANALYTICS_EVENTS.WEB_VITAL, {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: getRating(metric.name, metric.value),
    delta: Math.round(metric.delta),
    id: metric.id,
    navigationType: metric.navigationType,
  })
}

/**
 * Hook pour tracker les Web Vitals automatiquement
 */
export function useWebVitals() {
  useEffect(() => {
    // Core Web Vitals (2024+)
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics)
    onLCP(sendToAnalytics)

    // Autres métriques importantes
    onFCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  }, [])
}
