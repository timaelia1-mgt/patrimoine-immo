import { describe, it, expect } from 'vitest'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

describe('Analytics Events', () => {
  it('devrait avoir tous les événements auth définis', () => {
    expect(ANALYTICS_EVENTS.SIGNUP).toBe('signup')
    expect(ANALYTICS_EVENTS.LOGIN).toBe('login')
    expect(ANALYTICS_EVENTS.LOGOUT).toBe('logout')
  })

  it('devrait avoir tous les événements biens définis', () => {
    expect(ANALYTICS_EVENTS.BIEN_CREATED).toBe('bien_created')
    expect(ANALYTICS_EVENTS.BIEN_UPDATED).toBe('bien_updated')
    expect(ANALYTICS_EVENTS.BIEN_DELETED).toBe('bien_deleted')
    expect(ANALYTICS_EVENTS.BIEN_LIMIT_REACHED).toBe('bien_limit_reached')
  })

  it('devrait avoir tous les événements documents définis', () => {
    expect(ANALYTICS_EVENTS.QUITTANCE_GENERATED).toBe('quittance_generated')
    expect(ANALYTICS_EVENTS.QUITTANCE_SENT).toBe('quittance_sent')
    expect(ANALYTICS_EVENTS.EXPORT_EXCEL).toBe('export_excel')
    expect(ANALYTICS_EVENTS.EXPORT_PDF).toBe('export_pdf')
    expect(ANALYTICS_EVENTS.IMPORT_CSV).toBe('import_csv')
  })

  it('devrait avoir tous les événements Stripe définis', () => {
    expect(ANALYTICS_EVENTS.CHECKOUT_STARTED).toBe('checkout_started')
    expect(ANALYTICS_EVENTS.PAYMENT_SUCCEEDED).toBe('payment_succeeded')
    expect(ANALYTICS_EVENTS.PAYMENT_FAILED).toBe('payment_failed')
    expect(ANALYTICS_EVENTS.PLAN_UPGRADED).toBe('plan_upgraded')
    expect(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELED).toBe('subscription_canceled')
    expect(ANALYTICS_EVENTS.PORTAL_OPENED).toBe('portal_opened')
  })

  it('devrait avoir les événements performance définis', () => {
    expect(ANALYTICS_EVENTS.WEB_VITAL).toBe('web_vital')
    expect(ANALYTICS_EVENTS.ERROR).toBe('error')
  })

  it('devrait avoir des noms d\'événements uniques', () => {
    const events = Object.values(ANALYTICS_EVENTS)
    const uniqueEvents = new Set(events)
    expect(events.length).toBe(uniqueEvents.size)
  })

  it('devrait avoir exactement 20 événements', () => {
    const events = Object.keys(ANALYTICS_EVENTS)
    expect(events.length).toBe(20)
  })
})
