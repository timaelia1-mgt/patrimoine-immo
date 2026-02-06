import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { logger } from '@/lib/logger'

export interface QuittanceData {
  // Propriétaire
  proprietaireNom: string

  // Bien
  bienId: string
  bienNom: string
  bienAdresse: string
  bienVille: string
  bienCodePostal: string

  // Locataire
  locataireNom: string
  locatairePrenom: string
  locataireEmail: string | null

  // Paiement
  annee: number
  mois: number // 1-12
  datePayeLocataire: string // Format 'yyyy-MM-dd'
  datePayeAPL: string // Format 'yyyy-MM-dd'
  modePaiement: string // virement, cheque, especes, prelevement
  montantLocataire: number
  montantAPL: number
}

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  especes: 'Espèces',
  prelevement: 'Prélèvement automatique',
}

export function generateQuittancePDF(data: QuittanceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // --- COULEURS ---
  const darkColor = [30, 30, 40] as [number, number, number]
  const accentColor = [99, 102, 241] as [number, number, number] // indigo
  const grayColor = [100, 100, 110] as [number, number, number]
  const lightGray = [240, 240, 245] as [number, number, number]
  const greenColor = [34, 197, 94] as [number, number, number]

  // --- HEADER (fond sombre) ---
  doc.setFillColor(...darkColor)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Titre QUITTANCE DE LOYER
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('QUITTANCE DE LOYER', 15, 22)

  // Sous-titre : période (calculée à partir du mois)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 200)
  // Calculer début et fin du mois
  const debutMois = new Date(data.annee, data.mois - 1, 1)
  const finMois = new Date(data.annee, data.mois, 0)
  const periodeText = `Période : du ${format(debutMois, 'dd MMMM yyyy', { locale: fr })} au ${format(finMois, 'dd MMMM yyyy', { locale: fr })}`
  doc.text(periodeText, 15, 35)

  // Logo/Branding droit
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Patrimo', pageWidth - 15, 22, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 170)
  doc.text('Gestion Immobilière', pageWidth - 15, 30, { align: 'right' })

  // --- SECTION : PROPRIÉTAIRE & BIEN ---
  let y = 58

  // Propriétaire
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('PROPRIÉTAIRE', 15, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.setFontSize(10)
  doc.text(data.proprietaireNom, 15, y)

  // Bien (à droite)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('BIEN CONCERNÉ', pageWidth / 2 + 5, 58)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(data.bienNom, pageWidth / 2 + 5, 65)
  doc.text(`${data.bienAdresse}`, pageWidth / 2 + 5, 73)
  doc.text(`${data.bienCodePostal} ${data.bienVille}`, pageWidth / 2 + 5, 81)

  // --- LIGNE SÉPARATRICE ---
  y = 92
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.8)
  doc.line(15, y, pageWidth - 15, y)

  // --- SECTION : LOCATAIRE ---
  y = 105
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('LOCATAIRE', 15, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(`${data.locatairePrenom} ${data.locataireNom}`, 15, y)

  // --- SECTION : DÉTAILS PAIEMENT (tableau sur fond gris) ---
  y = 130
  doc.setFillColor(...lightGray)
  doc.roundedRect(15, y, pageWidth - 30, 75, 3, 3, 'F')

  // Titre tableau
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.setFontSize(10)
  doc.text('DÉTAILS DU PAIEMENT', 25, y)

  // Colonnes
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text('Description', 25, y)
  doc.text('Montant', pageWidth - 55, y)

  // Ligne séparateur
  y += 4
  doc.setDrawColor(200, 200, 210)
  doc.setLineWidth(0.3)
  doc.line(25, y, pageWidth - 25, y)

  // Loyer locataire
  y += 12
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Loyer mensuel (locataire)', 25, y)
  doc.text(`${data.montantLocataire.toFixed(2)} €`, pageWidth - 25, y, { align: 'right' })

  // APL (seulement si > 0)
  if (data.montantAPL > 0) {
    y += 10
    doc.text('APL (Aide au logement)', 25, y)
    doc.text(`${data.montantAPL.toFixed(2)} €`, pageWidth - 25, y, { align: 'right' })
  }

  // Ligne séparateur avant total
  y += 8
  doc.setDrawColor(180, 180, 195)
  doc.setLineWidth(0.5)
  doc.line(25, y, pageWidth - 25, y)

  // TOTAL
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkColor)
  doc.text('TOTAL REÇU', 25, y)
  doc.setTextColor(...greenColor)
  doc.text(`${(data.montantLocataire + data.montantAPL).toFixed(2)} €`, pageWidth - 25, y, { align: 'right' })

  // --- SECTION : INFORMATIONS DE PAIEMENT ---
  y = 230
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  const paiementLocataireText = `Paiement locataire : ${format(new Date(data.datePayeLocataire), 'dd MMMM yyyy', { locale: fr })}`
  doc.text(paiementLocataireText, 15, y)
  if (data.montantAPL > 0) {
    const paiementAPLText = `Paiement APL : ${format(new Date(data.datePayeAPL), 'dd MMMM yyyy', { locale: fr })}`
    doc.text(paiementAPLText, 15, y + 12)
    doc.text(`Mode de paiement : ${MODE_PAIEMENT_LABELS[data.modePaiement] || data.modePaiement}`, 15, y + 24)
  } else {
    doc.text(`Mode de paiement : ${MODE_PAIEMENT_LABELS[data.modePaiement] || data.modePaiement}`, 15, y + 12)
  }

  // --- BADGE "PAYÉ" ---
  doc.setFillColor(...greenColor)
  doc.roundedRect(pageWidth - 60, 225, 45, 22, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('✓ PAYÉ', pageWidth - 37, 240, { align: 'center' })

  // --- FOOTER ---
  doc.setDrawColor(200, 200, 210)
  doc.setLineWidth(0.3)
  doc.line(15, pageHeight - 35, pageWidth - 15, pageHeight - 35)

  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Cette quittance est générée par Patrimo - Gestion Immobilière', 15, pageHeight - 25)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, pageHeight - 18)
  doc.text('Ce document a une valeur juridique comme preuve de paiement de loyer.', 15, pageHeight - 11)

  // Logger la génération
  logger.info('[generateQuittance] PDF généré', {
    bienId: data.bienId,
    bienNom: data.bienNom,
    mois: data.mois,
    annee: data.annee,
    montantTotal: data.montantLocataire + data.montantAPL
  })

  return doc
}
