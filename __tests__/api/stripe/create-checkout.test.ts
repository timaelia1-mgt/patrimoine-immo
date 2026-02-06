import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockRequest } from '../../mocks/nextRequest'

// Mock de Stripe - les mocks doivent être définies DANS la factory pour éviter le hoisting
const mockCheckoutSessionsCreate = vi.fn()

vi.mock('stripe', () => {
  // Définir la classe DANS la factory
  const MockStripe = class {
    checkout = {
      sessions: {
        create: mockCheckoutSessionsCreate,
      },
    }
  }
  return { default: MockStripe }
})

// Import de la route APRÈS les mocks
import { POST } from '@/app/api/create-checkout/route'

describe('POST /api/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset le mock avec une réponse par défaut
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_default',
      id: 'cs_test_default',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('devrait créer une session checkout avec succès', async () => {
    mockCheckoutSessionsCreate.mockResolvedValueOnce({
      url: 'https://checkout.stripe.com/pay/cs_test_xxx',
      id: 'cs_test_xxx',
    })

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_xxx')
  })

  it('devrait rejeter si priceId manquant', async () => {
    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        userId: 'user-123',
        // priceId manquant
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('requis')
  })

  it('devrait rejeter si userId manquant', async () => {
    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        // userId manquant
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('requis')
  })

  it('devrait rejeter si body vide', async () => {
    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('devrait gérer les erreurs Stripe', async () => {
    mockCheckoutSessionsCreate.mockRejectedValueOnce(
      new Error('Invalid price ID')
    )

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'invalid_price',
        userId: 'user-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Invalid price ID')
  })

  it('devrait inclure les metadata userId dans la session', async () => {
    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_essentiel',
        userId: 'user-456',
      },
    })

    await POST(request)

    // Vérifier que Stripe a été appelé avec les bons paramètres
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        client_reference_id: 'user-456',
        metadata: expect.objectContaining({
          userId: 'user-456',
        }),
      })
    )
  })

  it('devrait configurer les URLs de succès et annulation', async () => {
    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    await POST(request)

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('success=true'),
        cancel_url: expect.stringContaining('canceled=true'),
      })
    )
  })
})
