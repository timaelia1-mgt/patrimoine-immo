/**
 * @fileoverview Fonctions de calcul financier pour les biens immobiliers
 * 
 * Ce module contient toutes les fonctions de calcul :
 * - Cash-flow mensuel et annuel
 * - Rentabilité brute et nette
 * - Taux de Rendement Interne (TRI)
 * - Taux d'autofinancement
 * - Mensualités de crédit
 */

/**
 * Convertit une valeur en nombre
 * 
 * Gère les différents types de valeurs (string, number, Decimal)
 * pour assurer des calculs cohérents.
 * 
 * @param value - Valeur à convertir
 * @returns number - La valeur convertie en nombre
 * @internal
 */
function toNumber(value: any): number {
  if (typeof value === 'string') return parseFloat(value)
  if (typeof value === 'number') return value
  if (value?.toNumber) return value.toNumber()
  return parseFloat(value?.toString() || '0')
}

/**
 * Calcule le cash-flow net mensuel d'un bien
 * 
 * Formule : Loyer - Charges mensuelles - Mensualité crédit
 * 
 * Le cash-flow représente l'argent réellement disponible chaque mois
 * après paiement de toutes les charges et du crédit.
 * 
 * @param bien - Objet bien avec les propriétés financières
 * @param bien.loyerMensuel - Loyer mensuel perçu
 * @param bien.taxeFonciere - Taxe foncière mensuelle
 * @param bien.chargesCopro - Charges de copropriété mensuelles
 * @param bien.assurance - Assurance mensuelle
 * @param bien.fraisGestion - Frais de gestion mensuels
 * @param bien.autresCharges - Autres charges mensuelles
 * @param bien.typeFinancement - "CREDIT" ou "CASH"
 * @param bien.mensualiteCredit - Mensualité du crédit (si CREDIT)
 * @returns number - Cash-flow mensuel (peut être négatif)
 * 
 * @example
 * const cashFlow = calculerCashFlow({
 *   loyerMensuel: 1200,
 *   taxeFonciere: 50,
 *   chargesCopro: 100,
 *   assurance: 30,
 *   fraisGestion: 0,
 *   autresCharges: 20,
 *   typeFinancement: 'CREDIT',
 *   mensualiteCredit: 800
 * })
 * console.log(cashFlow) // 200
 */
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

/**
 * Calcule le loyer net (après charges, avant crédit)
 * 
 * Formule : Loyer mensuel - Charges mensuelles
 * 
 * Le loyer net représente ce qui reste du loyer après paiement
 * de toutes les charges, mais avant le remboursement du crédit.
 * 
 * @param bien - Objet bien avec les propriétés financières
 * @returns number - Loyer net mensuel
 * 
 * @example
 * const loyerNet = calculerLoyerNet({
 *   loyerMensuel: 1200,
 *   taxeFonciere: 50,
 *   chargesCopro: 100,
 *   assurance: 30,
 *   fraisGestion: 0,
 *   autresCharges: 20
 * })
 * console.log(loyerNet) // 1000
 */
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

/**
 * Calcule le taux d'autofinancement d'un bien
 * 
 * Formule : (Loyer net / Mensualité crédit) * 100
 * 
 * Un taux de 100% signifie que le loyer couvre exactement la mensualité.
 * Au-dessus de 100%, le bien génère un cash-flow positif.
 * En-dessous de 100%, il faut compléter de sa poche.
 * 
 * @param bien - Objet bien avec les propriétés financières
 * @returns number - Taux d'autofinancement en % (100 = autofinancé)
 * 
 * @example
 * const taux = calculerTauxAutofinancement({
 *   loyerMensuel: 1200,
 *   taxeFonciere: 50,
 *   chargesCopro: 100,
 *   typeFinancement: 'CREDIT',
 *   mensualiteCredit: 1000
 * })
 * console.log(taux) // 105 (105% = cash-flow positif)
 */
export function calculerTauxAutofinancement(bien: any): number {
  if (bien.typeFinancement === "CASH") {
    return 100
  }
  
  const loyerNet = calculerLoyerNet(bien)
  const mensualiteCredit = toNumber(bien.mensualiteCredit || 0)
  
  if (mensualiteCredit === 0) return 100
  
  return (loyerNet / mensualiteCredit) * 100
}

/**
 * Vérifie si le crédit d'un bien est terminé
 * 
 * Compare la date de début du crédit + durée avec la date actuelle.
 * 
 * @param bien - Objet bien avec les données du crédit
 * @param bien.typeFinancement - "CREDIT" ou "CASH"
 * @param bien.dateDebutCredit - Date de début du crédit (ISO string)
 * @param bien.dureeCredit - Durée du crédit en mois
 * @returns boolean - true si le crédit est remboursé
 * 
 * @example
 * const termine = creditEstTermine({
 *   typeFinancement: 'CREDIT',
 *   dateDebutCredit: '2020-01-01',
 *   dureeCredit: 240 // 20 ans
 * })
 */
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

/**
 * Calcule le statut financier d'un bien
 * 
 * Détermine si le bien est :
 * - FINANCE : Payé cash ou crédit terminé
 * - AUTOFINANCE : Loyer couvre le crédit (≥100%)
 * - PARTIEL : Loyer couvre partiellement (70-99%)
 * - NON_AUTOFINANCE : Loyer insuffisant (<70%)
 * 
 * @param bien - Objet bien avec toutes les données financières
 * @returns Objet avec type, label, taux, couleur et badge
 * 
 * @example
 * const statut = calculerStatutBien(bien)
 * console.log(statut.badge) // "Autofinancé 105%"
 * console.log(statut.couleur) // "green"
 */
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

/**
 * Formate un montant en euros (format français)
 * 
 * @param amount - Montant à formater
 * @returns string - Montant formaté (ex: "1 234,56 €")
 * 
 * @example
 * formatCurrency(1234.56) // "1 234,56 €"
 * formatCurrency(-500) // "-500,00 €"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Calcule les charges mensuelles totales d'un bien
 * @param bien Objet bien avec les différentes charges
 * @returns Charges mensuelles totales en euros
 */
export function calculateChargesMensuelles(bien: {
  taxeFonciere?: number | null
  chargesCopro?: number | null
  assurance?: number | null
  fraisGestion?: number | null
  autresCharges?: number | null
}): number {
  // Toutes les charges sont stockées en mensuel dans la BDD
  const taxeFonciereMensuelle = parseFloat(bien.taxeFonciere?.toString() || "0") || 0
  const chargesCoproMensuelles = parseFloat(bien.chargesCopro?.toString() || "0") || 0
  const assuranceMensuelle = parseFloat(bien.assurance?.toString() || "0") || 0
  const fraisGestionMensuels = parseFloat(bien.fraisGestion?.toString() || "0") || 0
  const autresChargesMensuelles = parseFloat(bien.autresCharges?.toString() || "0") || 0
  
  const total = taxeFonciereMensuelle + 
                chargesCoproMensuelles + 
                assuranceMensuelle + 
                fraisGestionMensuels + 
                autresChargesMensuelles
  
  return isNaN(total) ? 0 : total
}

/**
 * Calcule la mensualité d'un crédit immobilier (amortissement français)
 * @param montant Montant emprunté en euros
 * @param tauxAnnuel Taux d'intérêt annuel en pourcentage (ex: 3.5 pour 3.5%)
 * @param dureeMois Durée du crédit en mois
 * @returns Mensualité en euros
 */
export function calculateMensualiteCredit(
  montant: number,
  tauxAnnuel: number,
  dureeMois: number
): number {
  if (!montant || !tauxAnnuel || !dureeMois || montant <= 0 || dureeMois <= 0) {
    return 0
  }
  
  const tauxMensuel = tauxAnnuel / 100 / 12
  
  // Si taux nul, amortissement linéaire
  if (tauxMensuel === 0) {
    return montant / dureeMois
  }
  
  // Formule amortissement français
  const mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois))
  
  return Math.round(mensualite * 100) / 100
}

/**
 * Calcule le TRI (Taux de Rendement Interne) d'un investissement immobilier
 * Utilise la méthode de Newton-Raphson pour résoudre l'équation de VAN = 0
 * 
 * @param investissementInitial - Montant investi au départ (négatif)
 * @param fluxAnnuels - Tableau des cash-flows annuels (positifs ou négatifs)
 * @returns TRI en pourcentage (ex: 5.2 pour 5.2%) ou null si pas calculable
 */
export function calculateTRI(
  investissementInitial: number,
  fluxAnnuels: number[]
): number | null {
  // Validation des données
  if (investissementInitial <= 0 || fluxAnnuels.length === 0) {
    return null
  }
  
  // Si tous les flux sont négatifs ou nuls, pas de TRI positif possible
  const sommeFlux = fluxAnnuels.reduce((sum, flux) => sum + flux, 0)
  if (sommeFlux <= 0) {
    return null
  }
  
  // Fonction VAN (Valeur Actuelle Nette)
  const calculerVAN = (taux: number): number => {
    let van = -investissementInitial
    for (let t = 0; t < fluxAnnuels.length; t++) {
      van += fluxAnnuels[t] / Math.pow(1 + taux, t + 1)
    }
    return van
  }
  
  // Dérivée de la VAN
  const calculerDeriveeVAN = (taux: number): number => {
    let derivee = 0
    for (let t = 0; t < fluxAnnuels.length; t++) {
      derivee -= (t + 1) * fluxAnnuels[t] / Math.pow(1 + taux, t + 2)
    }
    return derivee
  }
  
  // Méthode de Newton-Raphson
  let taux = 0.1 // Estimation initiale : 10%
  const maxIterations = 100
  const precision = 0.0001 // 0.01%
  
  for (let i = 0; i < maxIterations; i++) {
    const van = calculerVAN(taux)
    const derivee = calculerDeriveeVAN(taux)
    
    // Éviter division par zéro
    if (Math.abs(derivee) < 0.000001) {
      break
    }
    
    const nouveauTaux = taux - van / derivee
    
    // Vérifier la convergence
    if (Math.abs(nouveauTaux - taux) < precision) {
      // Limiter le TRI à des valeurs raisonnables (-100% à +100%)
      const triPourcentage = nouveauTaux * 100
      if (triPourcentage < -100 || triPourcentage > 100) {
        return null
      }
      return Math.round(triPourcentage * 10) / 10 // Arrondi à 1 décimale
    }
    
    taux = nouveauTaux
    
    // Éviter les taux négatifs extrêmes
    if (taux < -0.99) {
      taux = -0.99
    }
  }
  
  // Pas de convergence
  return null
}

/**
 * Calcule le TRI d'un bien immobilier en se basant sur son historique
 * 
 * @param bien - Objet bien avec toutes ses données
 * @param loyerMensuel - Loyer mensuel actuel
 * @param chargesMensuelles - Charges mensuelles actuelles
 * @param mensualiteCredit - Mensualité du crédit
 * @param moisPossession - Nombre de mois de possession
 * @returns TRI en pourcentage ou null
 */
export function calculateTRIBien(
  bien: any,
  loyerMensuel: number,
  chargesMensuelles: number,
  mensualiteCredit: number,
  moisPossession: number
): number | null {
  // Investissement initial
  const prixAchat = parseFloat(bien.prixAchat?.toString() || "0")
  const fraisNotaire = parseFloat(bien.fraisNotaire?.toString() || "0")
  const travauxInitiaux = parseFloat(bien.travauxInitiaux?.toString() || "0")
  const autresFrais = parseFloat(bien.autresFrais?.toString() || "0")
  const investissementInitial = prixAchat + fraisNotaire + travauxInitiaux + autresFrais
  
  // Si pas d'investissement, pas de TRI
  if (investissementInitial === 0) {
    return null
  }
  
  // Cash-flow mensuel
  const cashFlowMensuel = loyerMensuel - chargesMensuelles - mensualiteCredit
  
  // Convertir en flux annuels
  const anneesCompletes = Math.floor(moisPossession / 12)
  const moisRestants = moisPossession % 12
  
  const fluxAnnuels: number[] = []
  
  // Années complètes
  for (let i = 0; i < anneesCompletes; i++) {
    fluxAnnuels.push(cashFlowMensuel * 12)
  }
  
  // Année partielle
  if (moisRestants > 0) {
    fluxAnnuels.push(cashFlowMensuel * moisRestants)
  }
  
  // Si pas assez d'historique (moins de 6 mois), pas de TRI fiable
  if (moisPossession < 6) {
    return null
  }
  
  return calculateTRI(investissementInitial, fluxAnnuels)
}