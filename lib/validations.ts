import { toast } from 'sonner'

/**
 * Valide la cohérence des dates d'un bien immobilier
 */
export interface DatesValidation {
  dateAcquisition?: string | null
  dateMiseEnLocation?: string | null
  dateDebutCredit?: string | null
  dateEntreeLocataire?: string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Valide que les dates respectent une cohérence chronologique
 */
export function validateDatesCoherence(dates: DatesValidation): ValidationResult {
  const errors: string[] = []
  
  // Convertir les dates en objets Date
  const acquisition = dates.dateAcquisition ? new Date(dates.dateAcquisition) : null
  const miseEnLocation = dates.dateMiseEnLocation ? new Date(dates.dateMiseEnLocation) : null
  const debutCredit = dates.dateDebutCredit ? new Date(dates.dateDebutCredit) : null
  const entreeLocataire = dates.dateEntreeLocataire ? new Date(dates.dateEntreeLocataire) : null
  
  // Validation 1 : Date acquisition doit être avant date mise en location
  if (acquisition && miseEnLocation && acquisition > miseEnLocation) {
    errors.push('La date de mise en location ne peut pas être avant la date d\'acquisition')
  }
  
  // Validation 2 : Date début crédit doit être proche de la date d'acquisition (max 3 mois avant ou après)
  if (acquisition && debutCredit) {
    const diffMs = Math.abs(debutCredit.getTime() - acquisition.getTime())
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44)
    
    if (diffMonths > 3) {
      errors.push('La date de début du crédit devrait être proche de la date d\'acquisition (max 3 mois d\'écart)')
    }
  }
  
  // Validation 3 : Date entrée locataire doit être >= date mise en location
  if (miseEnLocation && entreeLocataire && entreeLocataire < miseEnLocation) {
    errors.push('La date d\'entrée du locataire ne peut pas être avant la date de mise en location')
  }
  
  // Validation 4 : Toutes les dates doivent être <= aujourd'hui (sauf si volontairement dans le futur)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // Fin de journée
  
  if (acquisition && acquisition > today) {
    // Tolérance : permettre les dates futures pour les projets en cours
    // Mais alerter l'utilisateur
    errors.push('⚠️ La date d\'acquisition est dans le futur - est-ce volontaire ?')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Affiche les erreurs de validation via toast
 */
export function showValidationErrors(errors: string[]): void {
  errors.forEach(error => {
    if (error.startsWith('⚠️')) {
      toast.warning(error)
    } else {
      toast.error(error)
    }
  })
}

/**
 * Valide et affiche les erreurs si nécessaire
 * Retourne true si valide, false sinon
 */
export function validateAndShowErrors(dates: DatesValidation): boolean {
  const result = validateDatesCoherence(dates)
  
  if (!result.isValid) {
    showValidationErrors(result.errors)
  }
  
  return result.isValid
}
