import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface RapportAnnuelData {
  proprietaireNom: string
  annee: number
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
  stats: {
    nbBiens: number
    patrimoineTotal: number
    loyersAnnuels: number
    chargesAnnuelles: number
    cashFlowAnnuel: number
    rentabiliteMoyenne: number
  }
}

// ─── COULEURS ───────────────────────────────────────────────
const C = {
  dark:       [15, 23, 42]    as [number,number,number], // slate-900
  darker:     [2, 6, 23]      as [number,number,number], // slate-950
  gold:       [245, 158, 11]  as [number,number,number], // amber-500
  goldLight:  [253, 211, 77]  as [number,number,number], // amber-300
  goldDark:   [180, 110, 5]   as [number,number,number], // amber-700
  white:      [255, 255, 255] as [number,number,number],
  slate300:   [203, 213, 225] as [number,number,number],
  slate400:   [148, 163, 184] as [number,number,number],
  slate600:   [71, 85, 105]   as [number,number,number],
  slate700:   [51, 65, 85]    as [number,number,number],
  slate800:   [30, 41, 59]    as [number,number,number],
  green:      [34, 197, 94]   as [number,number,number],
  greenDark:  [21, 128, 61]   as [number,number,number],
  red:        [239, 68, 68]   as [number,number,number],
  blue:       [99, 102, 241]  as [number,number,number],
}

// ─── HELPERS ────────────────────────────────────────────────
function formatEur(val: number, decimals = 0): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M€`
  if (val >= 1_000) return `${(val / 1_000).toFixed(decimals === 0 ? 0 : 1)}k€`
  return `${val.toFixed(decimals)}€`
}

function isCredit(type: string): boolean {
  return type?.toLowerCase() === 'credit'
}

export function generateRapportAnnuelPDF(data: RapportAnnuelData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()  // 297

  let page = 1
  const totalPages = () => 1 + Math.ceil(data.biens.length / 3) + 1 // couv + biens + synthèse

  // ═══════════════════════════════════════════════════════════
  //  PAGE 1 — COUVERTURE
  // ═══════════════════════════════════════════════════════════

  // Fond noir total
  doc.setFillColor(...C.darker)
  doc.rect(0, 0, W, H, 'F')

  // Bloc décoratif haut-droite
  doc.setFillColor(...C.dark)
  doc.rect(W - 60, 0, 60, 120, 'F')

  // Ligne gold verticale
  doc.setFillColor(...C.gold)
  doc.rect(W - 62, 0, 2, 120, 'F')

  // Pattern points décoratifs (simulé avec petits carrés)
  doc.setFillColor(245, 158, 11, 0.15)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      doc.setFillColor(245, 158, 11)
      doc.circle(W - 50 + col * 14, 15 + row * 14, 1, 'F')
    }
  }

  // ── Logo + Branding ──
  // Carré gold logo
  doc.setFillColor(...C.gold)
  doc.roundedRect(20, 28, 14, 14, 2, 2, 'F')
  doc.setTextColor(...C.darker)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('P', 27, 37.5, { align: 'center' })

  doc.setTextColor(...C.white)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Patrimo', 38, 37)

  // ── Titre principal ──
  doc.setTextColor(...C.gold)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('RAPPORT ANNUEL DE GESTION', 20, 75)

  doc.setTextColor(...C.white)
  doc.setFontSize(52)
  doc.setFont('helvetica', 'bold')
  doc.text(data.annee.toString(), 20, 110)

  // Ligne gold décorative
  doc.setFillColor(...C.gold)
  doc.rect(20, 116, 80, 1.5, 'F')

  // ── Info propriétaire ──
  doc.setTextColor(...C.slate400)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('PRÉPARÉ POUR', 20, 130)

  doc.setTextColor(...C.white)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.proprietaireNom, 20, 140)

  doc.setTextColor(...C.slate400)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Édité le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 150)

  // ── Cards stats couverture ──
  const cards = [
    { label: 'BIENS GÉRÉS',         value: data.stats.nbBiens.toString(),                     color: C.gold },
    { label: 'PATRIMOINE TOTAL',     value: formatEur(data.stats.patrimoineTotal),             color: C.blue },
    { label: 'REVENUS ANNUELS',      value: formatEur(data.stats.loyersAnnuels),               color: C.green },
    { label: 'CASH-FLOW ANNUEL',     value: (data.stats.cashFlowAnnuel >= 0 ? '+' : '') + formatEur(data.stats.cashFlowAnnuel), color: data.stats.cashFlowAnnuel >= 0 ? C.green : C.red },
    { label: 'CHARGES ANNUELLES',    value: formatEur(data.stats.chargesAnnuelles),            color: C.red },
    { label: 'RENTABILITÉ MOYENNE',  value: `${data.stats.rentabiliteMoyenne.toFixed(1)}%`,   color: C.gold },
  ]

  const cardW = (W - 50) / 3
  const cardH = 32
  const cardStartY = 170

  cards.forEach((card, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 20 + col * (cardW + 5)
    const y = cardStartY + row * (cardH + 8)

    // Fond card
    doc.setFillColor(...C.dark)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F')

    // Bordure top colorée
    doc.setFillColor(...card.color)
    doc.rect(x, y, cardW, 1.5, 'F')

    // Label
    doc.setTextColor(...C.slate400)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, y + 10)

    // Valeur
    doc.setTextColor(...card.color)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, y + 24)
  })

  // ── Footer couverture ──
  doc.setFillColor(...C.dark)
  doc.rect(0, H - 18, W, 18, 'F')
  doc.setFillColor(...C.gold)
  doc.rect(0, H - 18, W, 1, 'F')
  doc.setTextColor(...C.slate600)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Document confidentiel — Patrimo © ' + data.annee, W / 2, H - 8, { align: 'center' })

  // ═══════════════════════════════════════════════════════════
  //  HELPER : HEADER / FOOTER DE PAGE
  // ═══════════════════════════════════════════════════════════

  const drawHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(...C.darker)
    doc.rect(0, 0, W, H, 'F')

    // Bande header
    doc.setFillColor(...C.dark)
    doc.rect(0, 0, W, 22, 'F')
    doc.setFillColor(...C.gold)
    doc.rect(0, 22, W, 0.8, 'F')

    // Logo mini
    doc.setFillColor(...C.gold)
    doc.roundedRect(12, 6, 9, 9, 1.5, 1.5, 'F')
    doc.setTextColor(...C.darker)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('P', 16.5, 12, { align: 'center' })

    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Patrimo', 24, 12)

    // Titre page
    doc.setTextColor(...C.white)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, W / 2, 11, { align: 'center' })
    if (subtitle) {
      doc.setTextColor(...C.slate400)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(subtitle, W / 2, 17, { align: 'center' })
    }

    // Page number
    doc.setTextColor(...C.slate600)
    doc.setFontSize(8)
    doc.text(`${page} / ${Math.ceil(data.biens.length / 3) + 2}`, W - 14, 12, { align: 'right' })
  }

  const drawFooter = () => {
    doc.setFillColor(...C.dark)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setFillColor(...C.gold)
    doc.rect(0, H - 12, W, 0.5, 'F')
    doc.setTextColor(...C.slate600)
    doc.setFontSize(6.5)
    doc.text(`Rapport Annuel ${data.annee} — ${data.proprietaireNom} — Document confidentiel`, W / 2, H - 5, { align: 'center' })
  }

  // ═══════════════════════════════════════════════════════════
  //  PAGE(S) : DÉTAIL DES BIENS (3 biens par page)
  // ═══════════════════════════════════════════════════════════

  const BIENS_PER_PAGE = 3

  for (let pageIdx = 0; pageIdx < Math.ceil(data.biens.length / BIENS_PER_PAGE); pageIdx++) {
    doc.addPage()
    page++

    const biensSlice = data.biens.slice(pageIdx * BIENS_PER_PAGE, (pageIdx + 1) * BIENS_PER_PAGE)
    const isFirstBiensPage = pageIdx === 0
    
    drawHeader(
      'DÉTAIL DES BIENS',
      isFirstBiensPage ? `Portefeuille ${data.annee} — ${data.stats.nbBiens} bien${data.stats.nbBiens > 1 ? 's' : ''}` : undefined
    )

    let y = 30

    biensSlice.forEach((bien, i) => {
      const globalIdx = pageIdx * BIENS_PER_PAGE + i
      const cashFlow = bien.loyerMensuel - bien.chargesMensuelles - bien.mensualiteCredit
      const credit = isCredit(bien.typeFinancement)

      // ── Bloc bien ──
      doc.setFillColor(...C.dark)
      doc.roundedRect(12, y, W - 24, 72, 4, 4, 'F')

      // Barre latérale gold
      doc.setFillColor(...C.gold)
      doc.roundedRect(12, y, 3, 72, 2, 2, 'F')

      // ── Ligne 1 : Nom + badge ──
      doc.setTextColor(...C.white)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const nomTrunc = bien.nom.length > 30 ? bien.nom.substring(0, 28) + '…' : bien.nom
      doc.text(`${globalIdx + 1}. ${nomTrunc}`, 20, y + 11)

      // Badge type financement
      const badgeLabel = credit ? 'CRÉDIT' : 'COMPTANT'
      const badgeColor = credit ? C.blue : C.green
      doc.setFillColor(...badgeColor)
      doc.roundedRect(W - 48, y + 4, 34, 10, 2, 2, 'F')
      doc.setTextColor(...C.white)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(badgeLabel, W - 31, y + 10.5, { align: 'center' })

      // ── Ligne 2 : Adresse ──
      doc.setTextColor(...C.slate400)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adresse = [bien.adresse, bien.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'
      doc.text(adresse.length > 50 ? adresse.substring(0, 48) + '…' : adresse, 20, y + 19)

      // ── Séparateur ──
      doc.setDrawColor(...C.slate700)
      doc.setLineWidth(0.3)
      doc.line(20, y + 23, W - 20, y + 23)

      // ── Métriques principales (5 colonnes) ──
      const metrics = [
        { label: 'Loyer mensuel', value: `${bien.loyerMensuel.toFixed(0)} €`, color: C.white },
        { label: 'Charges / mois', value: `${bien.chargesMensuelles.toFixed(0)} €`, color: C.red },
        { label: credit ? 'Mensualité crédit' : 'Mensualité', value: credit ? `${bien.mensualiteCredit.toFixed(0)} €` : '—', color: credit ? C.blue : C.slate600 },
        { label: 'Cash-flow / mois', value: `${cashFlow >= 0 ? '+' : ''}${cashFlow.toFixed(0)} €`, color: cashFlow >= 0 ? C.green : C.red },
        { label: 'Investissement', value: formatEur(bien.investissementTotal), color: C.gold },
      ]

      const colW = (W - 44) / metrics.length
      metrics.forEach((m, mi) => {
        const mx = 20 + mi * colW
        const my = y + 29

        doc.setTextColor(...C.slate400)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(m.label, mx, my)

        doc.setTextColor(...m.color)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(m.value, mx, my + 10)
      })

      // ── Séparateur ──
      doc.setDrawColor(...C.slate700)
      doc.setLineWidth(0.3)
      doc.line(20, y + 44, W - 20, y + 44)

      // ── Rentabilités + mini bar chart ──
      // Rentabilité brute
      doc.setTextColor(...C.slate400)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Rentabilité brute', 20, y + 52)

      doc.setTextColor(...C.gold)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${bien.rentabiliteBrute.toFixed(1)}%`, 20, y + 61)

      // Bar brute
      const barMaxW = 50
      const brute = Math.min(bien.rentabiliteBrute / 15 * barMaxW, barMaxW)
      doc.setFillColor(...C.slate800)
      doc.roundedRect(20, y + 63, barMaxW, 3, 1, 1, 'F')
      doc.setFillColor(...C.gold)
      doc.roundedRect(20, y + 63, brute, 3, 1, 1, 'F')

      // Rentabilité nette
      doc.setTextColor(...C.slate400)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Rentabilité nette', 90, y + 52)

      doc.setTextColor(...C.green)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${bien.rentabiliteNette.toFixed(1)}%`, 90, y + 61)

      // Bar nette
      const nette = Math.min(bien.rentabiliteNette / 15 * barMaxW, barMaxW)
      doc.setFillColor(...C.slate800)
      doc.roundedRect(90, y + 63, barMaxW, 3, 1, 1, 'F')
      doc.setFillColor(...C.green)
      doc.roundedRect(90, y + 63, nette, 3, 1, 1, 'F')

      // Cash-flow annualisé
      doc.setTextColor(...C.slate400)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Cash-flow annuel', 158, y + 52)

      const cfAnnuel = cashFlow * 12
      doc.setTextColor(cfAnnuel >= 0 ? C.green[0] : C.red[0], cfAnnuel >= 0 ? C.green[1] : C.red[1], cfAnnuel >= 0 ? C.green[2] : C.red[2])
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${cfAnnuel >= 0 ? '+' : ''}${formatEur(cfAnnuel)}`, 158, y + 61)

      y += 78
    })

    drawFooter()
  }

  // ═══════════════════════════════════════════════════════════
  //  DERNIÈRE PAGE : SYNTHÈSE GRAPHIQUE
  // ═══════════════════════════════════════════════════════════

  doc.addPage()
  page++
  drawHeader('SYNTHÈSE & PERFORMANCE', `Rapport annuel ${data.annee}`)

  let y = 30

  // ── Section : Répartition du patrimoine ──
  doc.setTextColor(...C.gold)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('RÉPARTITION DU PATRIMOINE', 14, y + 8)
  doc.setFillColor(...C.gold)
  doc.rect(14, y + 10, 35, 0.8, 'F')

  // ── Bar chart horizontal par bien (investissement) ──
  const chartY = y + 16
  const chartMaxW = W - 100
  const maxInvest = Math.max(...data.biens.map(b => b.investissementTotal), 1)

  data.biens.slice(0, 8).forEach((bien, i) => {
    const barY = chartY + i * 11
    const barW = (bien.investissementTotal / maxInvest) * chartMaxW
    const label = bien.nom.length > 18 ? bien.nom.substring(0, 16) + '…' : bien.nom

    doc.setTextColor(...C.slate400)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 14, barY + 6)

    // Fond barre
    doc.setFillColor(...C.slate800)
    doc.roundedRect(70, barY, chartMaxW, 8, 1.5, 1.5, 'F')

    // Barre valeur
    const hue = i % 3 === 0 ? C.gold : i % 3 === 1 ? C.blue : C.green
    doc.setFillColor(...hue)
    doc.roundedRect(70, barY, Math.max(barW, 3), 8, 1.5, 1.5, 'F')

    // Valeur
    doc.setTextColor(...C.white)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(formatEur(bien.investissementTotal), 70 + chartMaxW + 3, barY + 6)
  })

  y += 16 + Math.min(data.biens.length, 8) * 11 + 12

  // ── Section : Cash-flow par bien ──
  doc.setTextColor(...C.gold)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CASH-FLOW MENSUEL PAR BIEN', 14, y + 8)
  doc.setFillColor(...C.gold)
  doc.rect(14, y + 10, 40, 0.8, 'F')

  const cfY = y + 16
  const cashFlows = data.biens.map(b => b.loyerMensuel - b.chargesMensuelles - b.mensualiteCredit)
  const maxAbsCF = Math.max(...cashFlows.map(cf => Math.abs(cf)), 1)
  const cfMaxW = (W - 100) / 2

  data.biens.slice(0, 6).forEach((bien, i) => {
    const cf = cashFlows[i]
    const barY = cfY + i * 11
    const label = bien.nom.length > 18 ? bien.nom.substring(0, 16) + '…' : bien.nom

    doc.setTextColor(...C.slate400)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 14, barY + 6)

    const centerX = 70 + cfMaxW
    const barW = (Math.abs(cf) / maxAbsCF) * cfMaxW

    // Ligne centrale
    doc.setDrawColor(...C.slate700)
    doc.setLineWidth(0.3)
    doc.line(centerX, barY, centerX, barY + 8)

    // Fond
    doc.setFillColor(...C.slate800)
    doc.roundedRect(70, barY, cfMaxW * 2, 8, 1.5, 1.5, 'F')

    if (cf >= 0) {
      doc.setFillColor(...C.green)
      doc.roundedRect(centerX, barY, Math.max(barW, 2), 8, 0, 0, 'F')
    } else {
      doc.setFillColor(...C.red)
      doc.roundedRect(centerX - Math.max(barW, 2), barY, Math.max(barW, 2), 8, 0, 0, 'F')
    }

    doc.setTextColor(cf >= 0 ? C.green[0] : C.red[0], cf >= 0 ? C.green[1] : C.red[1], cf >= 0 ? C.green[2] : C.red[2])
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`${cf >= 0 ? '+' : ''}${cf.toFixed(0)}€/m`, 70 + cfMaxW * 2 + 3, barY + 6)
  })

  y += 16 + Math.min(data.biens.length, 6) * 11 + 12

  // ── Section : Tableau récapitulatif ──
  doc.setTextColor(...C.gold)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TABLEAU RÉCAPITULATIF', 14, y + 8)
  doc.setFillColor(...C.gold)
  doc.rect(14, y + 10, 34, 0.8, 'F')

  y += 16

  // En-tête tableau
  const cols = [
    { label: 'Bien',           x: 14,  w: 45 },
    { label: 'Loyer / mois',   x: 61,  w: 28 },
    { label: 'Charges / mois', x: 91,  w: 28 },
    { label: 'Cash-flow',      x: 121, w: 28 },
    { label: 'Renta. nette',   x: 151, w: 26 },
    { label: 'Investissement', x: 179, w: 28 },
  ]

  // Header row
  doc.setFillColor(...C.dark)
  doc.rect(12, y, W - 24, 10, 'F')
  doc.setFillColor(...C.gold)
  doc.rect(12, y, W - 24, 0.8, 'F')

  cols.forEach(col => {
    doc.setTextColor(...C.gold)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(col.label, col.x + 2, y + 7)
  })

  y += 10

  // Rows
  data.biens.forEach((bien, i) => {
    const rowColor = i % 2 === 0 ? C.darker : C.dark
    doc.setFillColor(...rowColor)
    doc.rect(12, y, W - 24, 10, 'F')

    const cf = bien.loyerMensuel - bien.chargesMensuelles - bien.mensualiteCredit

    const rowData = [
      { val: bien.nom.length > 18 ? bien.nom.substring(0, 16) + '…' : bien.nom, color: C.white },
      { val: `${bien.loyerMensuel.toFixed(0)} €`, color: C.white },
      { val: `${bien.chargesMensuelles.toFixed(0)} €`, color: C.red },
      { val: `${cf >= 0 ? '+' : ''}${cf.toFixed(0)} €`, color: cf >= 0 ? C.green : C.red },
      { val: `${bien.rentabiliteNette.toFixed(1)}%`, color: C.gold },
      { val: formatEur(bien.investissementTotal), color: C.slate300 },
    ]

    rowData.forEach((cell, ci) => {
      doc.setTextColor(...cell.color)
      doc.setFontSize(7)
      doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal')
      doc.text(cell.val, cols[ci].x + 2, y + 7)
    })

    y += 10
  })

  // Ligne total
  doc.setFillColor(...C.dark)
  doc.rect(12, y, W - 24, 11, 'F')
  doc.setFillColor(...C.gold)
  doc.rect(12, y, W - 24, 0.5, 'F')

  const totalData = [
    { val: 'TOTAL',                                                          color: C.gold },
    { val: `${(data.stats.loyersAnnuels / 12).toFixed(0)} €`,               color: C.white },
    { val: `${(data.stats.chargesAnnuelles / 12).toFixed(0)} €`,            color: C.red },
    { val: `${data.stats.cashFlowAnnuel >= 0 ? '+' : ''}${(data.stats.cashFlowAnnuel / 12).toFixed(0)} €`, color: data.stats.cashFlowAnnuel >= 0 ? C.green : C.red },
    { val: `${data.stats.rentabiliteMoyenne.toFixed(1)}%`,                  color: C.gold },
    { val: formatEur(data.stats.patrimoineTotal),                           color: C.slate300 },
  ]

  totalData.forEach((cell, ci) => {
    doc.setTextColor(...cell.color)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text(cell.val, cols[ci].x + 2, y + 8)
  })

  drawFooter()

  return doc
}