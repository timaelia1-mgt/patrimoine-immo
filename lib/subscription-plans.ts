export type PlanType = "decouverte" | "investisseur" | "patrimoine"

export interface Plan {
  id: PlanType
  name: string
  maxBiens: number
  price: number
  priceAnnual: number
  features: string[]
  color: string
  popular?: boolean
}

export const PLANS: Record<PlanType, Plan> = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    maxBiens: 1,
    price: 0,
    priceAnnual: 0,
    color: "green",
    features: [
      "1 bien maximum",
      "Dashboard basique",
      "Suivi des loyers manuel",
      "Cash-flow simple"
    ]
  },
  investisseur: {
    id: "investisseur",
    name: "Investisseur",
    maxBiens: 5,
    price: 9.90,
    priceAnnual: 99,
    color: "blue",
    popular: true,
    features: [
      "Jusqu'à 5 biens",
      "Dashboard complet",
      "Suivi des loyers",
      "Autofinancement par bien",
      "Suivi locataire",
      "Alertes de retard"
    ]
  },
  patrimoine: {
    id: "patrimoine",
    name: "Patrimoine",
    maxBiens: 20,
    price: 19.90,
    priceAnnual: 199,
    color: "purple",
    features: [
      "Jusqu'à 20 biens",
      "Tout Investisseur inclus",
      "Historique long terme",
      "Comparaison des biens",
      "Exports CSV/PDF",
      "Support prioritaire"
    ]
  }
}
