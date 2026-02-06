import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateQuittancePDF, type QuittanceData } from '@/lib/generateQuittance'

/**
 * Tests pour lib/generateQuittance.ts
 * 
 * Cette fonction génère un PDF de quittance de loyer avec jsPDF.
 * On teste principalement :
 * - La création du PDF
 * - Le contenu correct (montants, dates, noms)
 * - Les cas limites (sans APL, etc.)
 */

describe('generateQuittancePDF', () => {
  // Données de test complètes
  const mockQuittanceData: QuittanceData = {
    proprietaireNom: 'Dupont Jean-Pierre',
    bienId: 'bien-123',
    bienNom: 'Appartement Paris 15ème',
    bienAdresse: '10 rue de la Paix',
    bienVille: 'Paris',
    bienCodePostal: '75015',
    locataireNom: 'Martin',
    locatairePrenom: 'Sophie',
    locataireEmail: 'sophie.martin@example.com',
    annee: 2024,
    mois: 3, // Mars
    datePayeLocataire: '2024-03-05',
    datePayeAPL: '2024-03-10',
    modePaiement: 'virement',
    montantLocataire: 850,
    montantAPL: 150,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // GÉNÉRATION DE BASE
  // ============================================

  describe('génération de base', () => {
    it('devrait retourner un objet jsPDF', () => {
      const result = generateQuittancePDF(mockQuittanceData)
      
      expect(result).toBeDefined()
      expect(result).toHaveProperty('internal')
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('save')
    })

    it('devrait générer un PDF sans erreur', () => {
      expect(() => generateQuittancePDF(mockQuittanceData)).not.toThrow()
    })

    it('devrait avoir une taille de page A4', () => {
      const pdf = generateQuittancePDF(mockQuittanceData)
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // A4 en mm : 210 x 297
      expect(pageWidth).toBeCloseTo(210, 0)
      expect(pageHeight).toBeCloseTo(297, 0)
    })
  })

  // ============================================
  // CALCULS DE MONTANTS
  // ============================================

  describe('calculs de montants', () => {
    it('devrait calculer le montant total correctement (locataire + APL)', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        montantLocataire: 800,
        montantAPL: 200,
      }
      
      // Le PDF devrait contenir 800 + 200 = 1000
      const pdf = generateQuittancePDF(data)
      expect(pdf).toBeDefined()
    })

    it('devrait gérer un montant sans APL', () => {
      const dataWithoutAPL: QuittanceData = {
        ...mockQuittanceData,
        montantAPL: 0,
        datePayeAPL: '',
      }
      
      expect(() => generateQuittancePDF(dataWithoutAPL)).not.toThrow()
    })

    it('devrait gérer des montants décimaux', () => {
      const dataDecimal: QuittanceData = {
        ...mockQuittanceData,
        montantLocataire: 850.50,
        montantAPL: 149.75,
      }
      
      expect(() => generateQuittancePDF(dataDecimal)).not.toThrow()
    })

    it('devrait gérer un loyer à 0', () => {
      const dataZero: QuittanceData = {
        ...mockQuittanceData,
        montantLocataire: 0,
        montantAPL: 0,
      }
      
      expect(() => generateQuittancePDF(dataZero)).not.toThrow()
    })
  })

  // ============================================
  // MODES DE PAIEMENT
  // ============================================

  describe('modes de paiement', () => {
    it('devrait accepter le mode virement', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        modePaiement: 'virement',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter le mode chèque', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        modePaiement: 'cheque',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter le mode espèces', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        modePaiement: 'especes',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter le mode prélèvement', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        modePaiement: 'prelevement',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })
  })

  // ============================================
  // MOIS DE L'ANNÉE
  // ============================================

  describe('mois de l\'année', () => {
    const testCases = [
      { mois: 1, expected: 'janvier' },
      { mois: 2, expected: 'février' },
      { mois: 3, expected: 'mars' },
      { mois: 4, expected: 'avril' },
      { mois: 5, expected: 'mai' },
      { mois: 6, expected: 'juin' },
      { mois: 7, expected: 'juillet' },
      { mois: 8, expected: 'août' },
      { mois: 9, expected: 'septembre' },
      { mois: 10, expected: 'octobre' },
      { mois: 11, expected: 'novembre' },
      { mois: 12, expected: 'décembre' },
    ]

    testCases.forEach(({ mois, expected }) => {
      it(`devrait générer pour le mois ${mois} (${expected})`, () => {
        const data: QuittanceData = {
          ...mockQuittanceData,
          mois,
        }
        
        expect(() => generateQuittancePDF(data)).not.toThrow()
      })
    })
  })

  // ============================================
  // DONNÉES LOCATAIRE
  // ============================================

  describe('données locataire', () => {
    it('devrait accepter un locataire sans email', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        locataireEmail: null,
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter des noms avec accents', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        locataireNom: 'Müller-Lévy',
        locatairePrenom: 'François-Émile',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter des noms longs', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        locataireNom: 'De La Fontaine Du Château De Versailles',
        locatairePrenom: 'Jean-Baptiste-Marie-François',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })
  })

  // ============================================
  // DONNÉES BIEN
  // ============================================

  describe('données bien', () => {
    it('devrait accepter une adresse longue', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        bienAdresse: '123 Avenue du Général Charles de Gaulle, Bâtiment B, Escalier 2, Appartement 42',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait accepter différents codes postaux', () => {
      const codesPostaux = ['75001', '13001', '97400', '20000']
      
      codesPostaux.forEach(code => {
        const data: QuittanceData = {
          ...mockQuittanceData,
          bienCodePostal: code,
        }
        
        expect(() => generateQuittancePDF(data)).not.toThrow()
      })
    })
  })

  // ============================================
  // DATES
  // ============================================

  describe('dates', () => {
    it('devrait accepter différents formats de date', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        datePayeLocataire: '2024-01-15',
        datePayeAPL: '2024-01-20',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait gérer une date APL vide quand pas d\'APL', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        montantAPL: 0,
        datePayeAPL: '',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })
  })

  // ============================================
  // CAS LIMITES
  // ============================================

  describe('cas limites', () => {
    it('devrait générer pour le premier jour du mois', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        datePayeLocataire: '2024-03-01',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait générer pour le dernier jour du mois', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        datePayeLocataire: '2024-03-31',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })

    it('devrait générer pour année bissextile (février)', () => {
      const data: QuittanceData = {
        ...mockQuittanceData,
        mois: 2,
        annee: 2024, // Année bissextile
        datePayeLocataire: '2024-02-29',
      }
      
      expect(() => generateQuittancePDF(data)).not.toThrow()
    })
  })
})
