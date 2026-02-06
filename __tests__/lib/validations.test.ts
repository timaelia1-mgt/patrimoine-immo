import { describe, it, expect } from 'vitest'
import {
  validateDatesCoherence,
  type DatesValidation,
  type ValidationResult,
} from '@/lib/validations'

// ============================================
// VALIDATION DES DATES
// ============================================

describe('validateDatesCoherence', () => {
  it('devrait retourner valide si aucune date fournie', () => {
    const dates: DatesValidation = {}
    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('devrait retourner valide pour des dates cohérentes', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-01-15',
      dateMiseEnLocation: '2023-03-01',
      dateDebutCredit: '2023-01-20',
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('devrait détecter mise en location avant acquisition', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-06-01',
      dateMiseEnLocation: '2023-03-01', // Avant acquisition !
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'La date de mise en location ne peut pas être avant la date d\'acquisition'
    )
  })

  it('devrait alerter si crédit trop éloigné de l\'acquisition (> 3 mois)', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-01-15',
      dateDebutCredit: '2023-06-15', // 5 mois après
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('date de début du crédit'))).toBe(true)
  })

  it('devrait accepter un crédit dans les 3 mois de l\'acquisition', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-01-15',
      dateDebutCredit: '2023-02-15', // 1 mois après
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(true)
  })

  it('devrait détecter entrée locataire avant mise en location', () => {
    const dates: DatesValidation = {
      dateMiseEnLocation: '2023-06-01',
      dateEntreeLocataire: '2023-03-01', // Avant mise en location !
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'La date d\'entrée du locataire ne peut pas être avant la date de mise en location'
    )
  })

  it('devrait alerter pour une date d\'acquisition future', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    const dates: DatesValidation = {
      dateAcquisition: futureDate.toISOString().split('T')[0],
    }

    const result = validateDatesCoherence(dates)
    
    // Devrait contenir un warning (pas forcément invalide)
    expect(result.errors.some(e => e.includes('dans le futur'))).toBe(true)
  })

  it('devrait accumuler plusieurs erreurs', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-06-01',
      dateMiseEnLocation: '2023-03-01', // Erreur 1 : avant acquisition
      dateDebutCredit: '2024-01-01', // Erreur 2 : trop éloigné
    }

    const result = validateDatesCoherence(dates)
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})

// ============================================
// TYPE CHECKING
// ============================================

describe('Types de validation', () => {
  it('devrait retourner un objet ValidationResult correct', () => {
    const dates: DatesValidation = {
      dateAcquisition: '2023-01-15',
    }

    const result: ValidationResult = validateDatesCoherence(dates)
    
    expect(typeof result.isValid).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
  })
})
