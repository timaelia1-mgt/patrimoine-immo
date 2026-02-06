import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface RapportAnnuelData {
  // Utilisateur
  proprietaireNom: string
  annee: number
  
  // Biens
  biens: Array<{
    nom: string
    typeFinancement: string
    adresse: string
    ville: string
    loyerMensuel: number
    chargesMensuelles: number
    mensualiteCredit: number
    investissementTotal: number
    rentabiliteBrute: number
    rentabiliteNette: number
  }>
  
  // Statistiques globales
  stats: {
    nbBiens: number
    patrimoineTotal: number
    loyersAnnuels: number
    chargesAnnuelles: number
    cashFlowAnnuel: number
    rentabiliteMoyenne: number
  }
}

export function generateRapportAnnuelPDF(data: RapportAnnuelData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Couleurs
  const darkColor = [30, 30, 40] as [number, number, number]
  const accentColor = [245, 158, 11] as [number, number, number] // Amber/Gold pour matcher le thème
  const grayColor = [100, 100, 110] as [number, number, number]
  const lightGray = [240, 240, 245] as [number, number, number]
  const greenColor = [34, 197, 94] as [number, number, number]
  const blueColor = [59, 130, 246] as [number, number, number]
  const redColor = [239, 68, 68] as [number, number, number]
  
  // --- PAGE 1 : COUVERTURE ---
  
  // Fond header avec dégradé simulé
  doc.setFillColor(...darkColor)
  doc.rect(0, 0, pageWidth, 85, 'F')
  
  // Bande accent
  doc.setFillColor(...accentColor)
  doc.rect(0, 85, pageWidth, 4, 'F')
  
  // Titre principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT ANNUEL', pageWidth / 2, 40, { align: 'center' })
  
  // Année
  doc.setFontSize(24)
  doc.setFont('helvetica', 'normal')
  doc.text(data.annee.toString(), pageWidth / 2, 58, { align: 'center' })
  
  // Branding
  doc.setFontSize(11)
  doc.setTextColor(180, 180, 200)
  doc.text('Patrimoine Immo - Gestion Immobilière', pageWidth / 2, 75, { align: 'center' })
  
  // Info propriétaire
  doc.setTextColor(...darkColor)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(`Propriétaire : ${data.proprietaireNom}`, 20, 105)
  doc.setFontSize(11)
  doc.setTextColor(...grayColor)
  doc.text(`Date d'édition : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 115)
  
  // Section Statistiques clés
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('Vue d\'ensemble', 20, 135)
  
  // Ligne décorative
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(2)
  doc.line(20, 139, 70, 139)
  
  let yCard = 150
  
  // Card 1 : Patrimoine Total
  doc.setFillColor(...lightGray)
  doc.roundedRect(15, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('PATRIMOINE TOTAL', 22, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...blueColor)
  const patrimoineText = data.stats.patrimoineTotal >= 1000000 
    ? `${(data.stats.patrimoineTotal / 1000000).toFixed(2)}M€`
    : `${(data.stats.patrimoineTotal / 1000).toFixed(0)}k€`
  doc.text(patrimoineText, 22, yCard + 30)
  
  // Card 2 : Nombre de biens
  doc.setFillColor(...lightGray)
  doc.roundedRect(110, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('NOMBRE DE BIENS', 117, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text(data.stats.nbBiens.toString(), 117, yCard + 30)
  
  yCard += 50
  
  // Card 3 : Revenus annuels
  doc.setFillColor(...lightGray)
  doc.roundedRect(15, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('REVENUS ANNUELS', 22, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...greenColor)
  doc.text(`${(data.stats.loyersAnnuels / 1000).toFixed(1)}k€`, 22, yCard + 30)
  
  // Card 4 : Cash-flow annuel
  doc.setFillColor(...lightGray)
  doc.roundedRect(110, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('CASH-FLOW ANNUEL', 117, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const cashFlowColor = data.stats.cashFlowAnnuel >= 0 ? greenColor : redColor
  doc.setTextColor(...cashFlowColor)
  const cashFlowSign = data.stats.cashFlowAnnuel >= 0 ? '+' : ''
  doc.text(`${cashFlowSign}${(data.stats.cashFlowAnnuel / 1000).toFixed(1)}k€`, 117, yCard + 30)
  
  yCard += 50
  
  // Card 5 : Charges annuelles
  doc.setFillColor(...lightGray)
  doc.roundedRect(15, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('CHARGES ANNUELLES', 22, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...redColor)
  doc.text(`${(data.stats.chargesAnnuelles / 1000).toFixed(1)}k€`, 22, yCard + 30)
  
  // Card 6 : Rentabilité moyenne
  doc.setFillColor(...lightGray)
  doc.roundedRect(110, yCard, 85, 40, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('RENTABILITÉ MOYENNE', 117, yCard + 12)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...blueColor)
  doc.text(`${data.stats.rentabiliteMoyenne.toFixed(1)}%`, 117, yCard + 30)
  
  // Footer page 1
  doc.setDrawColor(200, 200, 210)
  doc.setLineWidth(0.3)
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text('Document confidentiel - Page 1/' + (Math.ceil(data.biens.length / 4) + 1), pageWidth / 2, pageHeight - 12, { align: 'center' })
  
  // --- PAGE 2+ : DÉTAIL DES BIENS ---
  doc.addPage()
  
  let currentPage = 2
  const totalPages = Math.ceil(data.biens.length / 4) + 1
  
  // Fonction pour dessiner le header de page
  const drawPageHeader = (title: string) => {
    doc.setFillColor(...darkColor)
    doc.rect(0, 0, pageWidth, 35, 'F')
    doc.setFillColor(...accentColor)
    doc.rect(0, 35, pageWidth, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 20, 23)
  }
  
  // Fonction pour dessiner le footer de page
  const drawPageFooter = () => {
    doc.setDrawColor(200, 200, 210)
    doc.setLineWidth(0.3)
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
    doc.text(`Document confidentiel - Page ${currentPage}/${totalPages}`, pageWidth / 2, pageHeight - 12, { align: 'center' })
  }
  
  drawPageHeader('Détail des biens')
  
  let yPos = 50
  
  data.biens.forEach((bien, index) => {
    // Vérifier si on a assez de place (chaque bien prend ~55px)
    if (yPos > pageHeight - 75) {
      drawPageFooter()
      doc.addPage()
      currentPage++
      drawPageHeader('Détail des biens (suite)')
      yPos = 50
    }
    
    // Fond du bien avec bordure gauche colorée
    doc.setFillColor(...lightGray)
    doc.roundedRect(15, yPos, pageWidth - 30, 55, 4, 4, 'F')
    
    // Bordure gauche accent
    doc.setFillColor(...accentColor)
    doc.roundedRect(15, yPos, 4, 55, 2, 2, 'F')
    
    // Numéro et nom du bien
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text(`${index + 1}. ${bien.nom}`, 25, yPos + 12)
    
    // Badge type financement
    const typeText = bien.typeFinancement === 'CREDIT' ? 'Crédit' : 'Comptant'
    const badgeColor = bien.typeFinancement === 'CREDIT' ? blueColor : greenColor
    doc.setFillColor(...badgeColor)
    doc.roundedRect(pageWidth - 55, yPos + 5, 35, 12, 3, 3, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(typeText, pageWidth - 37, yPos + 13, { align: 'center' })
    
    // Adresse
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    const adresseComplete = [bien.adresse, bien.ville].filter(Boolean).join(', ')
    doc.text(adresseComplete || 'Adresse non renseignée', 25, yPos + 22)
    
    // Données financières - ligne 1
    const col1X = 25
    const col2X = 80
    const col3X = 135
    
    doc.setFontSize(9)
    
    // Loyer mensuel
    doc.setTextColor(...grayColor)
    doc.text('Loyer mensuel', col1X, yPos + 34)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text(`${bien.loyerMensuel.toFixed(0)} €`, col1X, yPos + 42)
    
    // Charges mensuelles
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('Charges', col2X, yPos + 34)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text(`${bien.chargesMensuelles.toFixed(0)} €`, col2X, yPos + 42)
    
    // Cash-flow
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('Cash-flow', col3X, yPos + 34)
    doc.setFont('helvetica', 'bold')
    const cashFlow = bien.loyerMensuel - bien.chargesMensuelles - bien.mensualiteCredit
    const cfColor = cashFlow >= 0 ? greenColor : redColor
    doc.setTextColor(...cfColor)
    doc.text(`${cashFlow >= 0 ? '+' : ''}${cashFlow.toFixed(0)} €/mois`, col3X, yPos + 42)
    
    // Rentabilité
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.setFontSize(8)
    doc.text(`Rentabilité : ${bien.rentabiliteBrute.toFixed(1)}% brute / ${bien.rentabiliteNette.toFixed(1)}% nette`, col1X, yPos + 52)
    
    // Investissement total (à droite)
    doc.text(`Investissement : ${(bien.investissementTotal / 1000).toFixed(0)}k€`, col3X, yPos + 52)
    
    yPos += 62
  })
  
  // Footer dernière page
  drawPageFooter()
  
  return doc
}
