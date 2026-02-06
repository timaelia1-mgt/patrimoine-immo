/**
 * @fileoverview Fonctions de validation pour les biens immobiliers
 * 
 * Ce module contient les fonctions de validation :
 * - Cohérence des dates (acquisition, location, crédit)
 * - Affichage des erreurs via toast
 */

import { toast } from 'sonner'

/**
 * Interface pour les dates à valider
 * 
 * Contient les différentes dates d'un bien immobilier
 * qui doivent respecter une cohérence chronologique.
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
 * Valide la cohérence chronologique des dates d'un bien
 * 
 * Vérifie que :
 * - La date de mise en location est après la date d'acquisition
 * - La date de début du crédit est proche de l'acquisition (±3 mois)
 * - La date d'entrée du locataire est après la mise en location
 * - Les dates ne sont pas trop dans le futur (alerte)
 * 
 * @param dates - Objet contenant les dates à valider
 * @param dates.dateAcquisition - Date d'achat du bien (optionnel)
 * @param dates.dateMiseEnLocation - Date de première location (optionnel)
 * @param dates.dateDebutCredit - Date de début du crédit (optionnel)
 * @param dates.dateEntreeLocataire - Date d'entrée du locataire actuel (optionnel)
 * @returns ValidationResult - Objet avec isValid (boolean) et errors (string[])
 * 
 * @example
 * const result = validateDatesCoherence({
 *   dateAcquisition: '2023-01-15',
 *   dateMiseEnLocation: '2023-03-01',
 *   dateDebutCredit: '2023-01-20'
 * })
 * 
 * if (!result.isValid) {
 *   console.log(result.errors) // Liste des erreurs
 * }
 * 
 * @example
 * // Dates incohérentes
 * const result = validateDatesCoherence({
 *   dateAcquisition: '2023-06-01',
 *   dateMiseEnLocation: '2023-03-01' // Avant acquisition !
 * })
 * console.log(result.isValid) // false
 * console.log(result.errors[0]) // "La date de mise en location..."
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
 * Affiche les erreurs de validation via des notifications toast
 * 
 * Les messages commençant par ⚠️ sont affichés en warning,
 * les autres en error.
 * 
 * @param errors - Tableau de messages d'erreur à afficher
 * 
 * @example
 * showValidationErrors([
 *   'La date de mise en location est invalide',
 *   '⚠️ La date d\'acquisition est dans le futur'
 * ])
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
 * Valide les dates et affiche automatiquement les erreurs
 * 
 * Combine validateDatesCoherence et showValidationErrors
 * pour une utilisation simplifiée dans les formulaires.
 * 
 * @param dates - Objet contenant les dates à valider
 * @returns boolean - true si toutes les dates sont valides, false sinon
 * 
 * @example
 * // Dans un handler de formulaire
 * const handleSubmit = (formData) => {
 *   if (!validateAndShowErrors({
 *     dateAcquisition: formData.dateAcquisition,
 *     dateMiseEnLocation: formData.dateMiseEnLocation
 *   })) {
 *     return // Les erreurs sont déjà affichées
 *   }
 *   
 *   // Continuer avec la soumission...
 * }
 */
export function validateAndShowErrors(dates: DatesValidation): boolean {
  const result = validateDatesCoherence(dates)
  
  if (!result.isValid) {
    showValidationErrors(result.errors)
  }
  
  return result.isValid
}
