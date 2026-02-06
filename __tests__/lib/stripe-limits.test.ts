import { describe, it, expect } from 'vitest'
import { canAddBien, getPlanMaxBiens, getRemainingBiens, isValidPlanType, getPlanDetails } from '@/lib/stripe'

describe('Vérification des limites de biens', () => {
  describe('canAddBien', () => {
    it('devrait autoriser avec plan gratuit et < 2 biens', () => {
      expect(canAddBien('gratuit', 0)).toBe(true)
      expect(canAddBien('gratuit', 1)).toBe(true)
    })

    it('devrait bloquer avec plan gratuit et >= 2 biens', () => {
      expect(canAddBien('gratuit', 2)).toBe(false)
      expect(canAddBien('gratuit', 3)).toBe(false)
    })

    it('devrait autoriser avec plan essentiel et < 10 biens', () => {
      expect(canAddBien('essentiel', 0)).toBe(true)
      expect(canAddBien('essentiel', 5)).toBe(true)
      expect(canAddBien('essentiel', 9)).toBe(true)
    })

    it('devrait bloquer avec plan essentiel et >= 10 biens', () => {
      expect(canAddBien('essentiel', 10)).toBe(false)
      expect(canAddBien('essentiel', 15)).toBe(false)
    })

    it('devrait toujours autoriser avec plan premium', () => {
      expect(canAddBien('premium', 0)).toBe(true)
      expect(canAddBien('premium', 100)).toBe(true)
      expect(canAddBien('premium', 1000)).toBe(true)
    })
  })

  describe('getPlanMaxBiens', () => {
    it('devrait retourner 2 pour le plan gratuit', () => {
      expect(getPlanMaxBiens('gratuit')).toBe(2)
    })

    it('devrait retourner 10 pour le plan essentiel', () => {
      expect(getPlanMaxBiens('essentiel')).toBe(10)
    })

    it('devrait retourner null pour le plan premium (illimité)', () => {
      expect(getPlanMaxBiens('premium')).toBeNull()
    })
  })

  describe('getRemainingBiens', () => {
    it('devrait calculer correctement les biens restants pour gratuit', () => {
      expect(getRemainingBiens('gratuit', 0)).toBe(2)
      expect(getRemainingBiens('gratuit', 1)).toBe(1)
      expect(getRemainingBiens('gratuit', 2)).toBe(0)
    })

    it('devrait retourner 0 minimum même si dépassé', () => {
      expect(getRemainingBiens('gratuit', 5)).toBe(0)
      expect(getRemainingBiens('essentiel', 15)).toBe(0)
    })

    it('devrait calculer correctement pour essentiel', () => {
      expect(getRemainingBiens('essentiel', 0)).toBe(10)
      expect(getRemainingBiens('essentiel', 5)).toBe(5)
      expect(getRemainingBiens('essentiel', 10)).toBe(0)
    })

    it('devrait retourner null pour premium (illimité)', () => {
      expect(getRemainingBiens('premium', 0)).toBeNull()
      expect(getRemainingBiens('premium', 100)).toBeNull()
      expect(getRemainingBiens('premium', 1000)).toBeNull()
    })
  })

  describe('isValidPlanType', () => {
    it('devrait accepter les plans valides', () => {
      expect(isValidPlanType('gratuit')).toBe(true)
      expect(isValidPlanType('essentiel')).toBe(true)
      expect(isValidPlanType('premium')).toBe(true)
    })

    it('devrait rejeter les plans invalides', () => {
      expect(isValidPlanType('invalid')).toBe(false)
      expect(isValidPlanType('')).toBe(false)
      expect(isValidPlanType('decouverte')).toBe(false)
      expect(isValidPlanType('investisseur')).toBe(false)
      expect(isValidPlanType('patrimoine')).toBe(false)
    })
  })

  describe('getPlanDetails', () => {
    it('devrait retourner les détails corrects pour chaque plan', () => {
      const gratuit = getPlanDetails('gratuit')
      expect(gratuit.name).toBe('Gratuit')
      expect(gratuit.price).toBe(0)
      expect(gratuit.maxBiens).toBe(2)
      expect(gratuit.priceId).toBeNull()

      const essentiel = getPlanDetails('essentiel')
      expect(essentiel.name).toBe('Essentiel')
      expect(essentiel.price).toBe(9.99)
      expect(essentiel.maxBiens).toBe(10)

      const premium = getPlanDetails('premium')
      expect(premium.name).toBe('Premium')
      expect(premium.price).toBe(19.99)
      expect(premium.maxBiens).toBeNull()
    })

    it('devrait inclure les features pour chaque plan', () => {
      const gratuit = getPlanDetails('gratuit')
      expect(gratuit.features.length).toBeGreaterThan(0)

      const essentiel = getPlanDetails('essentiel')
      expect(essentiel.features.length).toBeGreaterThan(0)

      const premium = getPlanDetails('premium')
      expect(premium.features.length).toBeGreaterThan(0)
      expect(premium.features.length).toBeGreaterThan(gratuit.features.length)
    })
  })

  describe('Scénarios réalistes', () => {
    it('devrait vérifier un import CSV qui dépasserait la limite', () => {
      const planType = 'gratuit' as const
      const currentBiens = 1
      const biensToImport = 3
      const maxBiens = getPlanMaxBiens(planType)

      // Vérifier que l'import dépasserait la limite
      const totalAfterImport = currentBiens + biensToImport
      const wouldExceedLimit = maxBiens !== null && totalAfterImport > maxBiens

      expect(wouldExceedLimit).toBe(true)
    })

    it('devrait vérifier un import CSV dans la limite', () => {
      const planType = 'essentiel' as const
      const currentBiens = 5
      const biensToImport = 3
      const maxBiens = getPlanMaxBiens(planType)

      const totalAfterImport = currentBiens + biensToImport
      const wouldExceedLimit = maxBiens !== null && totalAfterImport > maxBiens

      expect(wouldExceedLimit).toBe(false)
    })

    it('devrait vérifier un import CSV sans limite (premium)', () => {
      const planType = 'premium' as const
      const currentBiens = 50
      const biensToImport = 50
      const maxBiens = getPlanMaxBiens(planType)

      const wouldExceedLimit = maxBiens !== null && (currentBiens + biensToImport) > maxBiens

      expect(wouldExceedLimit).toBe(false)
    })

    it('devrait vérifier la séquence complète : ajout de biens un par un', () => {
      const planType = 'gratuit' as const
      
      // Peut ajouter le 1er bien (0 → 1)
      expect(canAddBien(planType, 0)).toBe(true)
      expect(getRemainingBiens(planType, 0)).toBe(2)
      
      // Peut ajouter le 2e bien (1 → 2)
      expect(canAddBien(planType, 1)).toBe(true)
      expect(getRemainingBiens(planType, 1)).toBe(1)
      
      // Ne peut PAS ajouter le 3e bien (2 → 3)
      expect(canAddBien(planType, 2)).toBe(false)
      expect(getRemainingBiens(planType, 2)).toBe(0)
    })
  })
})
