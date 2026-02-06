import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/signup/route'
import { createMockRequest, testData } from '../../mocks/nextRequest'

/**
 * Tests pour POST /api/auth/signup
 * 
 * Cette route gère l'inscription des nouveaux utilisateurs.
 * Elle valide :
 * - Format email
 * - Longueur mot de passe (>= 8 caractères)
 * - Complexité mot de passe (majuscule, minuscule, chiffre)
 */

// Mock du client Supabase server
const mockSupabaseAuth = {
  signUp: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: mockSupabaseAuth,
  })),
}))

// Mock du logger pour éviter les logs pendant les tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  },
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // SUCCÈS
  // ============================================

  describe('inscription réussie', () => {
    it('devrait créer un nouveau compte avec des données valides', async () => {
      const mockUser = {
        id: 'user-123',
        email: testData.validEmail,
      }

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: testData.validPassword,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
    })

    it('devrait appeler Supabase avec les bonnes données', async () => {
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: 'nouveau@example.com',
          password: 'SecurePass123',
        },
      })

      await POST(request)

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nouveau@example.com',
          password: 'SecurePass123',
        })
      )
    })
  })

  // ============================================
  // VALIDATION EMAIL
  // ============================================

  describe('validation email', () => {
    it('devrait rejeter un email invalide (sans @)', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: testData.validPassword,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('devrait rejeter un email invalide (format incorrect)', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: 'test@',
          password: testData.validPassword,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('devrait rejeter un email vide', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: '',
          password: testData.validPassword,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  // ============================================
  // VALIDATION MOT DE PASSE
  // ============================================

  describe('validation mot de passe', () => {
    it('devrait rejeter un mot de passe trop court (< 8 caractères)', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: 'Pass1', // 5 caractères
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('8 caractères')
    })

    it('devrait rejeter un mot de passe sans majuscule', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: 'password123', // pas de majuscule
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('majuscule')
    })

    it('devrait rejeter un mot de passe sans minuscule', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: 'PASSWORD123', // pas de minuscule
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('minuscule')
    })

    it('devrait rejeter un mot de passe sans chiffre', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: 'PasswordABC', // pas de chiffre
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('chiffre')
    })
  })

  // ============================================
  // DONNÉES MANQUANTES
  // ============================================

  describe('données manquantes', () => {
    it('devrait rejeter une requête sans email', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          password: testData.validPassword,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('devrait rejeter une requête sans mot de passe', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('devrait rejeter une requête sans body', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {},
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  // ============================================
  // ERREURS SUPABASE
  // ============================================

  describe('erreurs Supabase', () => {
    it('devrait gérer une erreur Supabase', async () => {
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: testData.validPassword,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('devrait retourner 500 en cas d\'erreur serveur inattendue', async () => {
      mockSupabaseAuth.signUp.mockRejectedValueOnce(new Error('Unexpected error'))

      const request = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: {
          email: testData.validEmail,
          password: testData.validPassword,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
