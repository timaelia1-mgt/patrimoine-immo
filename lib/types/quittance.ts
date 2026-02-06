export interface Quittance {
  id: string
  userId: string
  bienId: string
  
  // Période
  mois: number // 1-12
  annee: number
  
  // Locataire
  locataireNom: string
  locatairePrenom: string
  locataireEmail: string | null
  
  // Montants
  montantLocataire: number
  montantAPL: number
  montantTotal: number
  
  // Dates de paiement
  datePayeLocataire: string // ISO date
  datePayeAPL: string | null // ISO date
  modePaiement: string
  
  // Metadata
  emailEnvoye: boolean
  dateEnvoiEmail: string | null // ISO timestamp
  pdfUrl: string | null
  
  // Timestamps
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface QuittanceCreate {
  bienId: string
  mois: number
  annee: number
  locataireNom: string
  locatairePrenom: string
  locataireEmail: string | null
  montantLocataire: number
  montantAPL: number
  montantTotal: number
  datePayeLocataire: string
  datePayeAPL: string | null
  modePaiement: string
  emailEnvoye?: boolean
  dateEnvoiEmail?: string | null
}

export interface QuittanceWithBien extends Quittance {
  biens: {
    nom: string
    adresse: string
    ville: string
    codePostal: string
  }
}
