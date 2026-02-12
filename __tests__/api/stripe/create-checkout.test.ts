import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockRequest } from '../../mocks/nextRequest'

// Mock de Stripe - les mocks doivent être définies DANS la factory pour éviter le hoisting
const mockCheckoutSessionsCreate = vi.fn()
const mockCustomersRetrieve = vi.fn()
const mockCustomersCreate = vi.fn()

vi.mock('stripe', () => {
  // Définir la classe DANS la factory
  const MockStripe = class {
    checkout = {
      sessions: {
        create: mockCheckoutSessionsCreate,
      },
    }
    customers = {
      retrieve: mockCustomersRetrieve,
      create: mockCustomersCreate,
    }
  }
  return { default: MockStripe }
})

// Mock du client Supabase server
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

// Import de la route APRÈS les mocks
import { POST } from '@/app/api/create-checkout/route'

describe('POST /api/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock utilisateur authentifié par défaut
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    })

    // Mock profil avec customer existant par défaut
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_existing', email: 'test@test.com' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Mock customer retrieve valide par défaut
    mockCustomersRetrieve.mockResolvedValue({
      id: 'cus_existing',
      deleted: false,
    })

    // Mock customer create (pour le cas où on crée un nouveau)
    mockCustomersCreate.mockResolvedValue({
      id: 'cus_new_123',
    })

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

  it('devrait retourner 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
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

  it('devrait inclure customer et metadata userId dans la session', async () => {
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
        customer: 'cus_existing',
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

  it('devrait créer un nouveau customer si aucun existant', async () => {
    // Profil sans customer_id
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: null, email: 'test@test.com' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    await POST(request)

    expect(mockCustomersCreate).toHaveBeenCalled()
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_new_123',
      })
    )
  })

  it('devrait créer un nouveau customer si ID invalide (test→prod)', async () => {
    // customer.retrieve échoue (ID test en prod)
    mockCustomersRetrieve.mockRejectedValueOnce(
      new Error('No such customer: cus_test_xxx')
    )

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    await POST(request)

    // Doit créer un nouveau customer
    expect(mockCustomersCreate).toHaveBeenCalled()
    // Et l'utiliser pour la session
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_new_123',
      })
    )
  })

  it('devrait créer un nouveau customer si customer supprimé', async () => {
    // customer.retrieve retourne un customer supprimé
    mockCustomersRetrieve.mockResolvedValueOnce({
      id: 'cus_existing',
      deleted: true,
    })

    const request = createMockRequest('http://localhost:3000/api/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_123',
        userId: 'user-123',
      },
    })

    await POST(request)

    expect(mockCustomersCreate).toHaveBeenCalled()
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_new_123',
      })
    )
  })
})
