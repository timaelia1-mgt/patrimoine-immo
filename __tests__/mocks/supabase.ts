import { vi } from 'vitest'

/**
 * Mock du client Supabase pour les tests
 * 
 * Ce mock simule le comportement du client Supabase avec une API chainable.
 * Chaque méthode retourne le mock lui-même pour permettre le chaînage.
 */

// Créer une instance mock chainable
function createChainableMock() {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    upsert: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    neq: vi.fn(() => mock),
    gt: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lt: vi.fn(() => mock),
    lte: vi.fn(() => mock),
    like: vi.fn(() => mock),
    ilike: vi.fn(() => mock),
    is: vi.fn(() => mock),
    in: vi.fn(() => mock),
    contains: vi.fn(() => mock),
    containedBy: vi.fn(() => mock),
    range: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    
    // Pour les résultats finaux
    then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
  }
  
  return mock
}

export const mockSupabaseClient = {
  ...createChainableMock(),
  
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: null }, 
      error: null 
    })),
    getSession: vi.fn(() => Promise.resolve({ 
      data: { session: null }, 
      error: null 
    })),
    signInWithPassword: vi.fn(() => Promise.resolve({ 
      data: { user: null, session: null }, 
      error: null 
    })),
    signUp: vi.fn(() => Promise.resolve({ 
      data: { user: null, session: null }, 
      error: null 
    })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({ 
      data: { subscription: { unsubscribe: vi.fn() } } 
    })),
  },
  
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
      download: vi.fn(() => Promise.resolve({ data: null, error: null })),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/file.pdf' } })),
    })),
  },
}

/**
 * Créer un mock avec des données prédéfinies pour le résultat
 */
export function createMockWithData(data: any, error: any = null) {
  const mock = createChainableMock()
  mock.single.mockResolvedValue({ data, error })
  mock.maybeSingle.mockResolvedValue({ data, error })
  mock.then = vi.fn((resolve: any) => resolve({ data, error }))
  return mock
}

/**
 * Reset tous les mocks Supabase
 */
export function resetSupabaseMocks() {
  // Reset les mocks principaux
  const resetMock = (obj: any) => {
    Object.values(obj).forEach((value: any) => {
      if (typeof value === 'function' && value.mockClear) {
        value.mockClear()
      } else if (typeof value === 'object' && value !== null) {
        resetMock(value)
      }
    })
  }
  
  resetMock(mockSupabaseClient)
}

/**
 * Helper pour simuler une réponse Supabase réussie
 */
export function mockSuccessResponse<T>(data: T) {
  return Promise.resolve({ data, error: null })
}

/**
 * Helper pour simuler une erreur Supabase
 */
export function mockErrorResponse(message: string, code?: string) {
  return Promise.resolve({ 
    data: null, 
    error: { 
      message, 
      code: code || 'UNKNOWN_ERROR',
      details: null,
      hint: null,
    } 
  })
}

/**
 * Données de test pour les biens
 */
export const mockBienData = {
  id: 'bien-123',
  user_id: 'user-456',
  nom: 'Appartement Paris',
  adresse: '10 rue de la Paix',
  ville: 'Paris',
  code_postal: '75001',
  type_financement: 'credit',
  loyer_mensuel: 1000,
  charges_mensuelles: 200,
  taxe_fonciere: 1200,
  charges_copro: 100,
  assurance: 30,
  frais_gestion: 50,
  autres_charges: 20,
  montant_credit: 200000,
  taux_credit: 3.5,
  duree_credit: 240,
  mensualite_credit: 1160,
  prix_achat: 250000,
  frais_notaire: 18000,
  travaux_initiaux: 10000,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

/**
 * Données de test pour les profils utilisateur
 */
export const mockProfileData = {
  id: 'user-456',
  email: 'test@example.com',
  name: 'Jean Dupont',
  plan_type: 'decouverte',
  currency: 'EUR',
  rent_payment_day: 5,
  payment_delay_days: 10,
  email_alerts_enabled: true,
  app_notifications_enabled: true,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
}

/**
 * Données de test pour les locataires
 */
export const mockLocataireData = {
  id: 'loc-789',
  bien_id: 'bien-123',
  nom: 'Martin',
  prenom: 'Sophie',
  email: 'sophie@example.com',
  telephone: '0612345678',
  date_entree: '2024-01-15T00:00:00Z',
  montant_apl: 150,
  mode_paiement: 'virement',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

/**
 * Données de test pour les loyers
 */
export const mockLoyerData = {
  id: 'loyer-101',
  bien_id: 'bien-123',
  annee: 2024,
  mois: 2,
  montant_locataire: 850,
  montant_apl: 150,
  paye_locataire: true,
  paye_apl: true,
  date_paiement_locataire: '2024-03-05T00:00:00Z',
  date_paiement_apl: '2024-03-10T00:00:00Z',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-05T10:00:00Z',
}
