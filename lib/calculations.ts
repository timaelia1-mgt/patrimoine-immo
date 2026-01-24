import { Decimal } from "@prisma/client/runtime/library"

// Helper pour convertir Decimal en number
function toNumber(value: any): number {
  if (typeof value === 'string') return parseFloat(value)
  if (value?.toNumber) return value.toNumber()
  return parseFloat(value?.toString() || '0')
}

// Calculer le cash-flow net mensuel
export function calculerCashFlow(bien: any): number {
  const loyerMensuel = toNumber(bien.loyerMensuel)
  
  const chargesMensuelles = 
    toNumber(bien.taxeFonciere || 0) +
    toNumber(bien.chargesCopro || 0) +
    toNumber(bien.assurance || 0) +
    toNumber(bien.fraisGestion || 0) +
    toNumber(bien.autresCharges || 0)
  
  const mensualiteCredit = bien.typeFinancement !== "CASH" 
    ? toNumber(bien.mensualiteCredit || 0)
    : 0
  
  return loyerMensuel - chargesMensuelles - mensualiteCredit
}

// Calculer le loyer net (après charges, avant crédit)
export function calculerLoyerNet(bien: any): number {
  const loyerMensuel = toNumber(bien.loyerMensuel)
  
  const chargesMensuelles = 
    toNumber(bien.taxeFonciere || 0) +
    toNumber(bien.chargesCopro || 0) +
    toNumber(bien.assurance || 0) +
    toNumber(bien.fraisGestion || 0) +
    toNumber(bien.autresCharges || 0)
  
  return loyerMensuel - chargesMensuelles
}

// Calculer le taux d'autofinancement
export function calculerTauxAutofinancement(bien: any): number {
  if (bien.typeFinancement === "CASH") {
    return 100
  }
  
  const loyerNet = calculerLoyerNet(bien)
  const mensualiteCredit = toNumber(bien.mensualiteCredit || 0)
  
  if (mensualiteCredit === 0) return 100
  
  return (loyerNet / mensualiteCredit) * 100
}

// Vérifier si le crédit est terminé
export function creditEstTermine(bien: any): boolean {
  if (bien.typeFinancement === "CASH" || !bien.dateDebutCredit || !bien.dureeCredit) {
    return false
  }
  
  const dateDebut = new Date(bien.dateDebutCredit)
  const aujourdhui = new Date()
  const diffMs = aujourdhui.getTime() - dateDebut.getTime()
  const moisEcoules = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  
  return moisEcoules >= bien.dureeCredit
}

// Système de statut des biens
export function calculerStatutBien(bien: any): {
  type: "FINANCE" | "AUTOFINANCE" | "PARTIEL" | "NON_AUTOFINANCE"
  label: string
  taux: number
  couleur: "green" | "yellow" | "orange" | "red"
  badge: string
} {
  // 1. Bien payé CASH
  if (bien.typeFinancement === "CASH") {
    return {
      type: "FINANCE",
      label: "Financé (Cash)",
      taux: 100,
      couleur: "green",
      badge: "Financé"
    }
  }
  
  // 2. Crédit terminé
  if (creditEstTermine(bien)) {
    return {
      type: "FINANCE",
      label: "Financé (Crédit remboursé)",
      taux: 100,
      couleur: "green",
      badge: "Financé"
    }
  }
  
  // 3. Crédit en cours - calculer taux autofinancement
  const taux = calculerTauxAutofinancement(bien)
  
  if (taux >= 100) {
    return {
      type: "AUTOFINANCE",
      label: `Autofinancé (${Math.round(taux)}%)`,
      taux,
      couleur: "green",
      badge: `Autofinancé ${Math.round(taux)}%`
    }
  } else if (taux >= 70) {
    return {
      type: "PARTIEL",
      label: `Partiellement autofinancé (${Math.round(taux)}%)`,
      taux,
      couleur: "yellow",
      badge: `Partiel ${Math.round(taux)}%`
    }
  } else {
    return {
      type: "NON_AUTOFINANCE",
      label: `Non autofinancé (${Math.round(taux)}%)`,
      taux,
      couleur: "red",
      badge: `${Math.round(taux)}%`
    }
  }
}

// Formater en euros
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
