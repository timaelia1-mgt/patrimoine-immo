import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/biens/[id]/route'
import { createMockRequest, createMockParams } from '../../mocks/nextRequest'
import { mockBienData } from '../../mocks/supabase'

/**
 * Tests pour GET/PUT /api/biens/[id]
 * 
 * Ces routes permettent de :
 * - GET : Récupérer un bien par son ID
 * - PUT : Mettre à jour un bien existant
 * 
 * Note: Dans Next.js 14+, params est une Promise
 */

// Mock chainable Supabase
function createChainableMock(finalResult: { data: any; error: any }) {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(finalResult)),
    maybeSingle: vi.fn(() => Promise.resolve(finalResult)),
  }
  return mock
}

// Mock Supabase auth + database
const mockAuth = {
  getUser: vi.fn(),
}

let mockDbClient: any

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => {
    mockDbClient = createChainableMock({ data: null, error: null })
    mockDbClient.auth = mockAuth
    return Promise.resolve(mockDbClient)
  }),
}))

// Mock des fonctions database
vi.mock('@/lib/database', async (importOriginal) => {
  const original = await importOriginal() as any
  return {
    ...original,
    getBien: vi.fn(),
    updateBien: vi.fn(),
  }
})

import { getBien, updateBien } from '@/lib/database'

// Mock du logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  },
}))

describe('GET /api/biens/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // SUCCÈS
  // ============================================

  describe('récupération réussie', () => {
    it('devrait récupérer un bien par son ID', async () => {
      const mockBien = {
        ...mockBienData,
        id: 'bien-123',
        userId: 'user-456',
      }

      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce(mockBien)

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123')
      const params = createMockParams({ id: 'bien-123' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bien).toBeDefined()
      expect(data.bien.id).toBe('bien-123')
    })

    it('devrait appeler getBien avec le bon ID', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce({
        ...mockBienData,
        id: 'bien-xyz',
        userId: 'user-456',
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-xyz')
      const params = createMockParams({ id: 'bien-xyz' })

      await GET(request, { params })

      expect(getBien).toHaveBeenCalledWith('bien-xyz', expect.anything())
    })
  })

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  describe('authentification', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123')
      const params = createMockParams({ id: 'bien-123' })

      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('devrait retourner 401 si erreur auth', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Token expired' },
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123')
      const params = createMockParams({ id: 'bien-123' })

      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })
  })

  // ============================================
  // BIEN NON TROUVÉ
  // ============================================

  describe('bien non trouvé', () => {
    it('devrait retourner 404 si le bien n\'existe pas', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/biens/bien-inexistant')
      const params = createMockParams({ id: 'bien-inexistant' })

      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })
  })

  // ============================================
  // AUTORISATION
  // ============================================

  describe('autorisation', () => {
    it('devrait retourner 403 si le bien appartient à un autre utilisateur', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      // Le bien appartient à un autre utilisateur
      vi.mocked(getBien).mockResolvedValueOnce({
        ...mockBienData,
        id: 'bien-123',
        userId: 'autre-user-789', // Différent de user-456
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123')
      const params = createMockParams({ id: 'bien-123' })

      const response = await GET(request, { params })

      expect(response.status).toBe(403)
    })
  })
})

describe('PUT /api/biens/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // SUCCÈS
  // ============================================

  describe('mise à jour réussie', () => {
    it('devrait mettre à jour un bien', async () => {
      const existingBien = {
        ...mockBienData,
        id: 'bien-123',
        userId: 'user-456',
        nom: 'Ancien nom',
      }

      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce(existingBien)
      vi.mocked(updateBien).mockResolvedValueOnce({
        ...existingBien,
        nom: 'Nouveau nom',
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123', {
        method: 'PUT',
        body: { nom: 'Nouveau nom' },
      })
      const params = createMockParams({ id: 'bien-123' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(200)
    })

    it('devrait retourner success: true après mise à jour', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce({
        ...mockBienData,
        id: 'bien-123',
        userId: 'user-456',
      })
      vi.mocked(updateBien).mockResolvedValueOnce(mockBienData)

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123', {
        method: 'PUT',
        body: { loyerMensuel: 1200 },
      })
      const params = createMockParams({ id: 'bien-123' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(data.success).toBe(true)
    })
  })

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  describe('authentification', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123', {
        method: 'PUT',
        body: { nom: 'Test' },
      })
      const params = createMockParams({ id: 'bien-123' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(401)
    })
  })

  // ============================================
  // BIEN NON TROUVÉ
  // ============================================

  describe('bien non trouvé', () => {
    it('devrait retourner 404 si le bien n\'existe pas', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/biens/bien-inexistant', {
        method: 'PUT',
        body: { nom: 'Test' },
      })
      const params = createMockParams({ id: 'bien-inexistant' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(404)
    })
  })

  // ============================================
  // AUTORISATION
  // ============================================

  describe('autorisation', () => {
    it('devrait retourner 403 si le bien appartient à un autre utilisateur', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce({
        ...mockBienData,
        id: 'bien-123',
        userId: 'autre-user-789',
      })

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123', {
        method: 'PUT',
        body: { nom: 'Test' },
      })
      const params = createMockParams({ id: 'bien-123' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(403)
    })
  })

  // ============================================
  // ERREURS
  // ============================================

  describe('erreurs', () => {
    it('devrait retourner 500 en cas d\'erreur serveur', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      vi.mocked(getBien).mockResolvedValueOnce({
        ...mockBienData,
        id: 'bien-123',
        userId: 'user-456',
      })
      vi.mocked(updateBien).mockRejectedValueOnce(new Error('Database error'))

      const request = createMockRequest('http://localhost:3000/api/biens/bien-123', {
        method: 'PUT',
        body: { nom: 'Test' },
      })
      const params = createMockParams({ id: 'bien-123' })

      const response = await PUT(request, { params })

      expect(response.status).toBe(500)
    })
  })
})
