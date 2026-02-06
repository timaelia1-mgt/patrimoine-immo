import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockBienData,
  mockProfileData,
  mockLocataireData,
  mockLoyerData,
  resetSupabaseMocks,
} from '../mocks/supabase'

/**
 * Tests pour lib/database.ts
 * 
 * Ces tests vérifient les fonctions CRUD pour :
 * - Biens immobiliers
 * - Profils utilisateur
 * - Locataires
 * - Loyers
 * - Quittances
 */

// Créer un mock Supabase chainable
function createChainableMock(finalResult: { data: any; error: any }) {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    upsert: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(finalResult)),
    maybeSingle: vi.fn(() => Promise.resolve(finalResult)),
  }
  
  // Pour les appels qui retournent directement une promesse
  mock.then = (resolve: any) => resolve(finalResult)
  
  return mock
}

// Mock du module supabase/client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Import après le mock
import { createClient } from '@/lib/supabase/client'
import {
  getBiens,
  getBien,
  createBien,
  updateBien,
  deleteBien,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getLocataire,
  upsertLocataire,
  getLoyers,
  upsertLoyer,
  getInvestissementsSecondaires,
  createInvestissementSecondaire,
  deleteInvestissementSecondaire,
  createQuittance,
  getQuittancesByBien,
  getQuittancesByUser,
  getQuittance,
  updateQuittanceEmailStatus,
} from '@/lib/database'

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSupabaseMocks()
  })

  // ============================================
  // BIENS - GET
  // ============================================

  describe('getBiens', () => {
    it('devrait récupérer tous les biens d\'un utilisateur', async () => {
      const mockBiens = [mockBienData, { ...mockBienData, id: 'bien-456', nom: 'Maison Lyon' }]
      const mockClient = createChainableMock({ data: mockBiens, error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBiens('user-456')

      expect(mockClient.from).toHaveBeenCalledWith('biens')
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-456')
      expect(result).toHaveLength(2)
      expect(result[0].nom).toBe('Appartement Paris')
    })

    it('devrait retourner un tableau vide si pas de biens', async () => {
      const mockClient = createChainableMock({ data: [], error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBiens('user-456')

      expect(result).toEqual([])
    })

    it('devrait utiliser le client Supabase fourni si disponible', async () => {
      const mockBiens = [mockBienData]
      const providedClient = createChainableMock({ data: mockBiens, error: null })

      const result = await getBiens('user-456', providedClient)

      expect(providedClient.from).toHaveBeenCalledWith('biens')
      expect(result).toHaveLength(1)
    })

    it('devrait lever une erreur si Supabase échoue', async () => {
      const mockError = { code: 'PGRST000', message: 'Database error' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(getBiens('user-456')).rejects.toThrow()
    })
  })

  describe('getBien', () => {
    it('devrait récupérer un bien par ID', async () => {
      const mockClient = createChainableMock({ data: mockBienData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockBienData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBien('bien-123')

      expect(mockClient.from).toHaveBeenCalledWith('biens')
      expect(mockClient.eq).toHaveBeenCalledWith('id', 'bien-123')
      expect(result?.nom).toBe('Appartement Paris')
    })

    it('devrait retourner null si bien non trouvé', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBien('bien-inexistant')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // BIENS - CREATE
  // ============================================

  describe('createBien', () => {
    it('devrait créer un nouveau bien', async () => {
      // createBien fait plusieurs appels Supabase :
      // 1. getUserProfile (maybeSingle)
      // 2. getBiens pour vérifier la limite (retourne un tableau)
      // 3. insert du nouveau bien (single)
      
      let fromCallCount = 0
      const mockClient: any = {
        from: vi.fn(() => {
          fromCallCount++
          return mockClient
        }),
        select: vi.fn(() => mockClient),
        insert: vi.fn(() => mockClient),
        update: vi.fn(() => mockClient),
        delete: vi.fn(() => mockClient),
        eq: vi.fn(() => mockClient),
        order: vi.fn(() => mockClient),
        limit: vi.fn(() => mockClient),
        single: vi.fn(() => Promise.resolve({ data: mockBienData, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
      }
      
      // Pour le then (getBiens retourne via then)
      mockClient.then = vi.fn((resolve: any) => {
        // Retourner un tableau vide pour getBiens
        return resolve({ data: [], error: null })
      })
      
      vi.mocked(createClient).mockReturnValue(mockClient)

      const newBien = {
        nom: 'Nouveau bien',
        adresse: '123 rue Test',
        ville: 'Lyon',
        codePostal: '69001',
        typeFinancement: 'CASH' as const,
        loyerMensuel: 800,
        prixAchat: 150000,
      }

      const result = await createBien('user-456', newBien)

      expect(mockClient.from).toHaveBeenCalledWith('biens')
      expect(mockClient.insert).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.nom).toBe('Appartement Paris') // Du mock
    })
  })

  // ============================================
  // BIENS - UPDATE
  // ============================================

  describe('updateBien', () => {
    it('devrait mettre à jour un bien existant', async () => {
      const updatedData = { ...mockBienData, nom: 'Appartement Modifié' }
      const mockClient = createChainableMock({ data: updatedData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: updatedData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await updateBien('bien-123', { nom: 'Appartement Modifié' })

      expect(mockClient.from).toHaveBeenCalledWith('biens')
      expect(mockClient.update).toHaveBeenCalled()
      expect(mockClient.eq).toHaveBeenCalledWith('id', 'bien-123')
      expect(result.nom).toBe('Appartement Modifié')
    })

    it('devrait convertir les noms camelCase en snake_case', async () => {
      const mockClient = createChainableMock({ data: mockBienData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockBienData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await updateBien('bien-123', { loyerMensuel: 1200, taxeFonciere: 1500 })

      expect(mockClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          loyer_mensuel: 1200,
          taxe_fonciere: 1500,
        })
      )
    })
  })

  // ============================================
  // BIENS - DELETE
  // ============================================

  describe('deleteBien', () => {
    it('devrait supprimer un bien', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(deleteBien('bien-123')).resolves.not.toThrow()

      expect(mockClient.from).toHaveBeenCalledWith('biens')
      expect(mockClient.delete).toHaveBeenCalled()
    })

    it('devrait lever une erreur si la suppression échoue', async () => {
      const mockError = { message: 'Delete failed' }
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(deleteBien('bien-123')).rejects.toThrow()
    })
  })

  // ============================================
  // PROFILS UTILISATEUR
  // ============================================

  describe('getUserProfile', () => {
    it('devrait récupérer le profil d\'un utilisateur', async () => {
      const mockClient = createChainableMock({ data: mockProfileData, error: null })
      mockClient.maybeSingle = vi.fn(() => Promise.resolve({ data: mockProfileData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getUserProfile('user-456')

      expect(mockClient.from).toHaveBeenCalledWith('profiles')
      expect(mockClient.eq).toHaveBeenCalledWith('id', 'user-456')
      expect(result?.email).toBe('test@example.com')
      expect(result?.plan).toBe('decouverte')
    })

    it('devrait retourner null si profil non trouvé', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getUserProfile('user-inexistant')

      expect(result).toBeNull()
    })
  })

  describe('createUserProfile', () => {
    it('devrait créer un nouveau profil utilisateur', async () => {
      const newProfile = { ...mockProfileData, id: 'new-user' }
      const mockClient = createChainableMock({ data: newProfile, error: null })
      mockClient.maybeSingle = vi.fn(() => Promise.resolve({ data: newProfile, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await createUserProfile('new-user', 'new@example.com', 'New User')

      expect(mockClient.from).toHaveBeenCalledWith('profiles')
      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-user',
          email: 'new@example.com',
          plan_type: 'decouverte',
        })
      )
      expect(result).toBeDefined()
    })
  })

  describe('updateUserProfile', () => {
    it('devrait mettre à jour un profil utilisateur', async () => {
      const updatedProfile = { ...mockProfileData, name: 'Nouveau Nom' }
      const mockClient = createChainableMock({ data: updatedProfile, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: updatedProfile, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await updateUserProfile('user-456', { name: 'Nouveau Nom' })

      expect(mockClient.update).toHaveBeenCalled()
      expect(result.name).toBe('Nouveau Nom')
    })
  })

  // ============================================
  // LOCATAIRES
  // ============================================

  describe('getLocataire', () => {
    it('devrait récupérer le locataire d\'un bien', async () => {
      const mockClient = createChainableMock({ data: mockLocataireData, error: null })
      mockClient.maybeSingle = vi.fn(() => Promise.resolve({ data: mockLocataireData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getLocataire('bien-123')

      expect(mockClient.from).toHaveBeenCalledWith('locataires')
      expect(mockClient.eq).toHaveBeenCalledWith('bien_id', 'bien-123')
      expect(result?.nom).toBe('Martin')
      expect(result?.prenom).toBe('Sophie')
    })

    it('devrait retourner null si pas de locataire', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getLocataire('bien-sans-locataire')

      expect(result).toBeNull()
    })
  })

  describe('upsertLocataire', () => {
    it('devrait créer ou mettre à jour un locataire', async () => {
      const mockClient = createChainableMock({ data: mockLocataireData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockLocataireData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const locataireData = {
        nom: 'Durand',
        prenom: 'Pierre',
        email: 'pierre@example.com',
        montantAPL: 200,
      }

      const result = await upsertLocataire('bien-123', locataireData)

      expect(mockClient.from).toHaveBeenCalledWith('locataires')
      expect(mockClient.upsert).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  // ============================================
  // LOYERS
  // ============================================

  describe('getLoyers', () => {
    it('devrait récupérer les loyers d\'un bien pour une année', async () => {
      const mockLoyers = [
        mockLoyerData,
        { ...mockLoyerData, id: 'loyer-102', mois: 3 },
        { ...mockLoyerData, id: 'loyer-103', mois: 4 },
      ]
      const mockClient = createChainableMock({ data: mockLoyers, error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getLoyers('bien-123', 2024)

      expect(mockClient.from).toHaveBeenCalledWith('loyers')
      expect(mockClient.eq).toHaveBeenCalledWith('bien_id', 'bien-123')
      expect(mockClient.eq).toHaveBeenCalledWith('annee', 2024)
      expect(result).toHaveLength(3)
    })

    it('devrait retourner un tableau vide si pas de loyers', async () => {
      const mockClient = createChainableMock({ data: [], error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getLoyers('bien-123', 2024)

      expect(result).toEqual([])
    })

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      const mockClient = createChainableMock({ data: null, error: { message: 'Error' } })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getLoyers('bien-123', 2024)

      expect(result).toEqual([])
    })
  })

  describe('upsertLoyer', () => {
    it('devrait créer ou mettre à jour un loyer', async () => {
      const mockClient = createChainableMock({ data: mockLoyerData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockLoyerData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const paiement = {
        montantLocataire: 850,
        montantAPL: 150,
        payeLocataire: true,
        payeAPL: true,
      }

      const result = await upsertLoyer('bien-123', 2024, 3, paiement)

      expect(mockClient.from).toHaveBeenCalledWith('loyers')
      expect(mockClient.upsert).toHaveBeenCalled()
      expect(result.montantLocataire).toBe(850)
    })

    it('devrait lever une erreur si upsert échoue', async () => {
      const mockError = { message: 'Upsert failed' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const paiement = {
        montantLocataire: 850,
        montantAPL: 150,
        payeLocataire: true,
        payeAPL: true,
      }

      await expect(upsertLoyer('bien-123', 2024, 3, paiement)).rejects.toThrow()
    })
  })

  // ============================================
  // CONVERSION DE DONNÉES
  // ============================================

  describe('conversion de données', () => {
    it('devrait convertir correctement les données Supabase en objet Bien', async () => {
      const mockClient = createChainableMock({ data: mockBienData, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockBienData, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBien('bien-123')

      // Vérifier la conversion snake_case -> camelCase
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('codePostal')
      expect(result).toHaveProperty('typeFinancement')
      expect(result).toHaveProperty('loyerMensuel')
      expect(result).toHaveProperty('chargesMensuelles')
      expect(result).toHaveProperty('taxeFonciere')
    })

    it('devrait convertir correctement le type de financement', async () => {
      const bienCredit = { ...mockBienData, type_financement: 'credit' }
      const mockClient = createChainableMock({ data: bienCredit, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: bienCredit, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBien('bien-123')

      expect(result?.typeFinancement).toBe('CREDIT')
    })

    it('devrait convertir comptant en CASH', async () => {
      const bienCash = { ...mockBienData, type_financement: 'comptant' }
      const mockClient = createChainableMock({ data: bienCash, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: bienCash, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getBien('bien-123')

      expect(result?.typeFinancement).toBe('CASH')
    })
  })

  // ============================================
  // INVESTISSEMENTS SECONDAIRES
  // ============================================

  describe('getInvestissementsSecondaires', () => {
    it('devrait récupérer les investissements secondaires d\'un bien', async () => {
      const mockInvestissements = [
        { id: 'inv-1', bien_id: 'bien-123', date: '2024-01-15', description: 'Travaux', montant: 5000, created_at: '2024-01-15', updated_at: '2024-01-15' },
        { id: 'inv-2', bien_id: 'bien-123', date: '2024-03-10', description: 'Réparations', montant: 1500, created_at: '2024-03-10', updated_at: '2024-03-10' },
      ]
      const mockClient = createChainableMock({ data: mockInvestissements, error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getInvestissementsSecondaires('bien-123')

      expect(mockClient.from).toHaveBeenCalledWith('investissements_secondaires')
      expect(mockClient.eq).toHaveBeenCalledWith('bien_id', 'bien-123')
      expect(result).toHaveLength(2)
      expect(result[0].montant).toBe(5000)
      expect(result[0].description).toBe('Travaux')
    })

    it('devrait retourner un tableau vide si pas d\'investissements', async () => {
      const mockClient = createChainableMock({ data: [], error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getInvestissementsSecondaires('bien-123')

      expect(result).toEqual([])
    })

    it('devrait lever une erreur si Supabase échoue', async () => {
      const mockError = { message: 'Database error' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(getInvestissementsSecondaires('bien-123')).rejects.toThrow('Impossible de récupérer les investissements secondaires')
    })
  })

  describe('createInvestissementSecondaire', () => {
    it('devrait créer un investissement secondaire', async () => {
      const newInvestissement = { id: 'inv-new', bien_id: 'bien-123', date: '2024-06-01', description: 'Peinture', montant: 2000, created_at: '2024-06-01', updated_at: '2024-06-01' }
      const mockClient = createChainableMock({ data: newInvestissement, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: newInvestissement, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await createInvestissementSecondaire('bien-123', {
        date: '2024-06-01',
        description: 'Peinture',
        montant: 2000,
      })

      expect(mockClient.from).toHaveBeenCalledWith('investissements_secondaires')
      expect(mockClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        bien_id: 'bien-123',
        description: 'Peinture',
        montant: 2000,
      }))
      expect(result.montant).toBe(2000)
    })

    it('devrait lever une erreur si la création échoue', async () => {
      const mockError = { message: 'Insert failed' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(createInvestissementSecondaire('bien-123', {
        date: '2024-06-01',
        description: 'Test',
        montant: 1000,
      })).rejects.toThrow('Impossible de créer l\'investissement secondaire')
    })
  })

  describe('deleteInvestissementSecondaire', () => {
    it('devrait supprimer un investissement secondaire', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(deleteInvestissementSecondaire('inv-123')).resolves.not.toThrow()

      expect(mockClient.from).toHaveBeenCalledWith('investissements_secondaires')
      expect(mockClient.delete).toHaveBeenCalled()
    })

    it('devrait lever une erreur si la suppression échoue', async () => {
      const mockError = { message: 'Delete failed' }
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(deleteInvestissementSecondaire('inv-123')).rejects.toThrow('Impossible de supprimer l\'investissement secondaire')
    })
  })

  // ============================================
  // QUITTANCES
  // ============================================

  describe('createQuittance', () => {
    it('devrait créer une quittance', async () => {
      const quittanceData = {
        bienId: 'bien-123',
        mois: 3,
        annee: 2024,
        locataireNom: 'Martin',
        locatairePrenom: 'Sophie',
        locataireEmail: 'sophie@example.com',
        montantLocataire: 800,
        montantAPL: 200,
        montantTotal: 1000,
        datePayeLocataire: '2024-03-05',
        datePayeAPL: '2024-03-10',
        modePaiement: 'virement',
      }
      const createdQuittance = {
        id: 'quit-123',
        bien_id: 'bien-123',
        user_id: 'user-123',
        mois: 3,
        annee: 2024,
        locataire_nom: 'Martin',
        locataire_prenom: 'Sophie',
        locataire_email: 'sophie@example.com',
        montant_locataire: 800,
        montant_apl: 200,
        montant_total: 1000,
        date_paye_locataire: '2024-03-05',
        date_paye_apl: '2024-03-10',
        mode_paiement: 'virement',
        email_envoye: false,
        date_envoi_email: null,
        pdf_url: null,
        created_at: '2024-03-01',
        updated_at: '2024-03-01',
      }
      const mockClient = createChainableMock({ data: createdQuittance, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: createdQuittance, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await createQuittance(quittanceData)

      expect(mockClient.from).toHaveBeenCalledWith('quittances')
      expect(mockClient.insert).toHaveBeenCalled()
      expect(result.mois).toBe(3)
      expect(result.locataireNom).toBe('Martin')
    })

    it('devrait lever une erreur si la création échoue', async () => {
      const mockError = { message: 'Creation failed' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(createQuittance({
        bienId: 'bien-123',
        mois: 1,
        annee: 2024,
        locataireNom: 'Test',
        locatairePrenom: 'User',
        locataireEmail: null,
        montantLocataire: 1000,
        montantAPL: 0,
        montantTotal: 1000,
        datePayeLocataire: '2024-01-05',
        datePayeAPL: null,
        modePaiement: 'especes',
      })).rejects.toThrow()
    })
  })

  describe('getQuittancesByBien', () => {
    it('devrait récupérer les quittances d\'un bien', async () => {
      const mockQuittances = [
        { id: 'q1', bien_id: 'bien-123', mois: 1, annee: 2024, locataire_nom: 'Martin', locataire_prenom: 'Sophie', montant_total: 1000 },
        { id: 'q2', bien_id: 'bien-123', mois: 2, annee: 2024, locataire_nom: 'Martin', locataire_prenom: 'Sophie', montant_total: 1000 },
      ]
      const mockClient = createChainableMock({ data: mockQuittances, error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getQuittancesByBien('bien-123')

      expect(mockClient.from).toHaveBeenCalledWith('quittances')
      expect(mockClient.eq).toHaveBeenCalledWith('bien_id', 'bien-123')
      expect(result).toHaveLength(2)
    })

    it('devrait lever une erreur si Supabase échoue', async () => {
      const mockError = { message: 'Database error' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(getQuittancesByBien('bien-123')).rejects.toThrow()
    })
  })

  describe('getQuittancesByUser', () => {
    it('devrait récupérer les quittances d\'un utilisateur', async () => {
      const mockQuittances = [
        { id: 'q1', user_id: 'user-123', bien_id: 'bien-1', mois: 1, annee: 2024, locataire_nom: 'Martin' },
        { id: 'q2', user_id: 'user-123', bien_id: 'bien-2', mois: 1, annee: 2024, locataire_nom: 'Durand' },
      ]
      const mockClient = createChainableMock({ data: mockQuittances, error: null })
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getQuittancesByUser('user-123')

      expect(mockClient.from).toHaveBeenCalledWith('quittances')
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toHaveLength(2)
    })

    it('devrait lever une erreur si Supabase échoue', async () => {
      const mockError = { message: 'Database error' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(getQuittancesByUser('user-123')).rejects.toThrow()
    })
  })

  describe('getQuittance', () => {
    it('devrait récupérer une quittance spécifique', async () => {
      const mockQuittance = {
        id: 'q1',
        bien_id: 'bien-123',
        mois: 3,
        annee: 2024,
        locataire_nom: 'Martin',
        locataire_prenom: 'Sophie',
        montant_total: 1000,
      }
      const mockClient = createChainableMock({ data: mockQuittance, error: null })
      mockClient.single = vi.fn(() => Promise.resolve({ data: mockQuittance, error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getQuittance('bien-123', 3, 2024)

      expect(mockClient.from).toHaveBeenCalledWith('quittances')
      expect(mockClient.eq).toHaveBeenCalledWith('bien_id', 'bien-123')
      expect(mockClient.eq).toHaveBeenCalledWith('mois', 3)
      expect(mockClient.eq).toHaveBeenCalledWith('annee', 2024)
      expect(result?.mois).toBe(3)
    })

    it('devrait retourner null si quittance non trouvée', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      const result = await getQuittance('bien-123', 12, 2024)

      expect(result).toBeNull()
    })

    it('devrait lever une erreur pour les autres erreurs', async () => {
      const mockError = { code: 'PGRST000', message: 'Database error' }
      const mockClient = createChainableMock({ data: null, error: mockError })
      mockClient.single = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(getQuittance('bien-123', 1, 2024)).rejects.toThrow()
    })
  })

  describe('updateQuittanceEmailStatus', () => {
    it('devrait mettre à jour le statut d\'envoi d\'email', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(updateQuittanceEmailStatus('quit-123', true, '2024-03-15T10:00:00Z')).resolves.not.toThrow()

      expect(mockClient.from).toHaveBeenCalledWith('quittances')
      expect(mockClient.update).toHaveBeenCalledWith(expect.objectContaining({
        email_envoye: true,
        date_envoi_email: '2024-03-15T10:00:00Z',
      }))
    })

    it('devrait utiliser la date actuelle si non fournie', async () => {
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: null }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await updateQuittanceEmailStatus('quit-123', true)

      expect(mockClient.update).toHaveBeenCalledWith(expect.objectContaining({
        email_envoye: true,
        date_envoi_email: expect.any(String),
      }))
    })

    it('devrait lever une erreur si la mise à jour échoue', async () => {
      const mockError = { message: 'Update failed' }
      const mockClient = createChainableMock({ data: null, error: null })
      mockClient.eq = vi.fn(() => Promise.resolve({ error: mockError }))
      vi.mocked(createClient).mockReturnValue(mockClient)

      await expect(updateQuittanceEmailStatus('quit-123', true)).rejects.toThrow()
    })
  })
})
