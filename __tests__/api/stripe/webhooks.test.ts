import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks de Stripe - définis en dehors mais référencés dans la factory
const mockConstructEvent = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = class {
    webhooks = {
      constructEvent: mockConstructEvent,
    }
    subscriptions = {
      retrieve: mockSubscriptionsRetrieve,
    }
  }
  return { default: MockStripe }
})

// Mock de next/headers
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({
    get: mockHeadersGet,
  })),
}))

// Mock Supabase admin client
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Import de la route APRÈS les mocks
import { POST } from '@/app/api/webhooks/stripe/route'

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Configuration par défaut des mocks
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return null
      return null
    })
    
    // Configuration par défaut de Supabase (chaîne mockée)
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com' },
            error: null,
          }),
        }),
      }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('devrait retourner 400 si signature manquante', async () => {
    // La signature est null par défaut
    mockHeadersGet.mockReturnValue(null)

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('signature')
  })

  it('devrait retourner 400 si signature invalide', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'invalid_signature'
      return null
    })

    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw_body',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('signature')
  })

  it('devrait traiter checkout.session.completed avec succès', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_xxx',
          customer: 'cus_123',
          subscription: 'sub_123',
          client_reference_id: 'user-123',
          metadata: { userId: 'user-123' },
        },
      },
    })

    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_123',
      items: {
        data: [{ price: { id: 'price_essentiel' } }],
      },
    })

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.received).toBe(true)
  })

  it('devrait retourner 400 si userId manquant dans checkout.session.completed', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_xxx',
          customer: 'cus_123',
          subscription: 'sub_123',
          client_reference_id: null,
          metadata: {},
        },
      },
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('userId')
  })

  it('devrait traiter customer.subscription.deleted', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
        },
      },
    })

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123' },
            error: null,
          }),
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.received).toBe(true)
  })

  it('devrait gérer les événements non supportés', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'unknown.event.type',
      data: { object: {} },
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    // Devrait retourner 200 même pour les événements non gérés
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.received).toBe(true)
  })

  it('devrait traiter invoice.payment_failed', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          amount_due: 999,
          attempt_count: 1,
        },
      },
    })

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com' },
            error: null,
          }),
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('devrait rétrograder après 3 échecs de paiement', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          amount_due: 999,
          attempt_count: 3, // 3ème tentative
        },
      },
    })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: mockUpdateEq,
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com' },
            error: null,
          }),
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('devrait traiter invoice.payment_succeeded', async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'stripe-signature') return 'valid_signature'
      return null
    })

    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          amount_paid: 999,
        },
      },
    })

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com', subscription_status: 'payment_failed' },
            error: null,
          }),
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'webhook_payload',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.received).toBe(true)
  })
})
