import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockRequest } from '../../mocks/nextRequest'

// Mock de Stripe - les mocks doivent être définis en dehors mais référencés correctement
const mockBillingPortalSessionsCreate = vi.fn()
const mockCustomersRetrieve = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = class {
    billingPortal = {
      sessions: {
        create: mockBillingPortalSessionsCreate,
      },
    }
    customers = {
      retrieve: mockCustomersRetrieve,
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
import { POST } from '@/app/api/create-portal-session/route'

describe('POST /api/create-portal-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset la chaîne Supabase par défaut (select + update)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_default', email: 'test@test.com', plan_type: 'essentiel' },
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
      id: 'cus_default',
      deleted: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('devrait créer une session portal avec succès', async () => {
    // Mock utilisateur authentifié
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profil avec customer_id (via la chaîne)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: 'cus_123456',
              email: 'test@example.com',
              plan_type: 'essentiel',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Mock customer retrieve valide
    mockCustomersRetrieve.mockResolvedValueOnce({
      id: 'cus_123456',
      deleted: false,
    })

    // Mock Stripe portal session
    mockBillingPortalSessionsCreate.mockResolvedValueOnce({
      url: 'https://billing.stripe.com/p/session/test_xxx',
      id: 'bps_xxx',
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe('https://billing.stripe.com/p/session/test_xxx')
  })

  it('devrait retourner 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('devrait retourner 404 si profil non trouvé', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Profile not found' },
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(404)
  })

  it('devrait retourner 400 si pas de stripe_customer_id', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: null, // Pas de customer ID
              email: 'test@example.com',
              plan_type: 'gratuit',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('abonnement')
  })

  it('devrait retourner 400 si customer ID invalide (test→prod)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: 'cus_test_invalid',
              email: 'test@example.com',
              plan_type: 'essentiel',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Customer retrieve échoue (ID test en prod)
    mockCustomersRetrieve.mockRejectedValueOnce(
      new Error('No such customer: cus_test_invalid')
    )

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('souscrire à nouveau')
  })

  it('devrait retourner 400 si customer Stripe supprimé', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: 'cus_deleted',
              email: 'test@example.com',
              plan_type: 'essentiel',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Customer existe mais est supprimé
    mockCustomersRetrieve.mockResolvedValueOnce({
      id: 'cus_deleted',
      deleted: true,
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('souscrire à nouveau')
  })

  it('devrait gérer les erreurs Stripe du portal', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: 'cus_123',
              email: 'test@example.com',
              plan_type: 'essentiel',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Customer valide
    mockCustomersRetrieve.mockResolvedValueOnce({
      id: 'cus_123',
      deleted: false,
    })

    // Mais erreur portal
    mockBillingPortalSessionsCreate.mockRejectedValueOnce(
      new Error('Stripe portal error')
    )

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })

  it('devrait configurer la return_url correctement', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              stripe_customer_id: 'cus_123',
              email: 'test@example.com',
              plan_type: 'essentiel',
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Customer valide
    mockCustomersRetrieve.mockResolvedValueOnce({
      id: 'cus_123',
      deleted: false,
    })

    mockBillingPortalSessionsCreate.mockResolvedValueOnce({
      url: 'https://billing.stripe.com/p/session/xxx',
      id: 'bps_xxx',
    })

    const request = createMockRequest('http://localhost:3000/api/create-portal-session', {
      method: 'POST',
    })

    await POST(request)

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
        return_url: expect.stringContaining('/abonnement'),
      })
    )
  })
})
