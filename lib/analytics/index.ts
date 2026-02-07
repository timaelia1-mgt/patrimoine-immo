// Client-side exports (safe for browser)
export { trackEvent, identifyUser, resetUser, setSuperProperties } from './client'
export { PostHogProvider } from './provider'
export { useWebVitals } from './web-vitals'

// Events (shared)
export { ANALYTICS_EVENTS } from './events'
export type { AnalyticsEvent, EventProperties } from './events'

// Server-side exports are imported directly where needed:
//   import { trackServerEvent } from '@/lib/analytics/server'
// DO NOT export server-side functions here to avoid bundling posthog-node in client
