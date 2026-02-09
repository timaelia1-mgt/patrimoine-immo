import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBiens, getUserProfile } from '@/lib/database'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'
// XLSX est importé dynamiquement pour réduire le bundle initial

export async function GET() {
  try {
    // 1. VÉRIFIER L'AUTHENTIFICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('[API export-excel] Tentative non authentifiée')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    logger.info('[API export-excel] Export Excel demandé', { userId: user.id })
    
    // 2. RÉCUPÉRER TOUS LES BIENS DE L'UTILISATEUR
    const biens = await getBiens(user.id, supabase)
    
    if (!biens || biens.length === 0) {
      logger.info('[API export-excel] Aucun bien à exporter', { userId: user.id })
      return NextResponse.json(
        { 
          error: 'Aucun bien à exporter',
          message: 'Vous n\'avez aucun bien à exporter. Ajoutez d\'abord des biens depuis le dashboard.'
        },
        { status: 404 }
      )
    }
    
    // 3. PRÉPARER LES DONNÉES POUR EXCEL
    const excelData = biens.map((bien) => {
      // Calcul des totaux
      const investissementTotal = (
        (bien.prixAchat || 0) + 
        (bien.fraisNotaire || 0) + 
        (bien.travauxInitiaux || 0) + 
        (bien.autresFrais || 0)
      )
      
      const chargesTotal = (
        (bien.taxeFonciere || 0) +
        (bien.chargesCopro || 0) +
        (bien.assurance || 0) +
        (bien.fraisGestion || 0) +
        (bien.autresCharges || 0)
      )
      
      const mensualite = bien.typeFinancement === 'CREDIT' ? (bien.mensualiteCredit || 0) : 0
      const cashFlow = (bien.loyerMensuel || 0) - chargesTotal - mensualite
      
      // Calcul rentabilité brute
      const rentabiliteBrute = investissementTotal > 0 
        ? ((bien.loyerMensuel || 0) * 12 / investissementTotal) * 100 
        : 0
      
      // Calcul rentabilité nette
      const rentabiliteNette = investissementTotal > 0 
        ? (((bien.loyerMensuel || 0) - chargesTotal) * 12 / investissementTotal) * 100 
        : 0

      return {
        'Nom': bien.nom || '',
        'Type Financement': bien.typeFinancement === 'CREDIT' ? 'Crédit' : 'Comptant',
        'Adresse': bien.adresse || '',
        'Code Postal': bien.codePostal || '',
        'Ville': bien.ville || '',
        
        // Investissement
        'Prix d\'achat (€)': bien.prixAchat || 0,
        'Frais de notaire (€)': bien.fraisNotaire || 0,
        'Travaux initiaux (€)': bien.travauxInitiaux || 0,
        'Autres frais (€)': bien.autresFrais || 0,
        'Investissement total (€)': investissementTotal,
        
        // Financement
        'Montant crédit (€)': bien.montantCredit || 0,
        'Taux crédit (%)': bien.tauxCredit || 0,
        'Durée crédit (mois)': bien.dureeCredit || 0,
        'Mensualité crédit (€)': bien.mensualiteCredit || 0,
        'Capital restant dû (€)': bien.capitalRestantDu || 0,
        
        // Revenus
        'Loyer mensuel (€)': bien.loyerMensuel || 0,
        
        // Charges détaillées
        'Taxe foncière (€/an)': bien.taxeFonciere || 0,
        'Charges copro (€/mois)': bien.chargesCopro || 0,
        'Assurance (€/mois)': bien.assurance || 0,
        'Frais gestion (€/mois)': bien.fraisGestion || 0,
        'Autres charges (€/mois)': bien.autresCharges || 0,
        'Charges totales (€/mois)': chargesTotal,
        
        // Rentabilité
        'Rentabilité brute (%)': Math.round(rentabiliteBrute * 100) / 100,
        'Rentabilité nette (%)': Math.round(rentabiliteNette * 100) / 100,
        'Cash-flow mensuel (€)': Math.round(cashFlow * 100) / 100,
        
        // Dates
        'Date d\'acquisition': bien.dateAcquisition 
          ? new Date(bien.dateAcquisition).toLocaleDateString('fr-FR') 
          : '',
        'Date mise en location': bien.dateMiseEnLocation 
          ? new Date(bien.dateMiseEnLocation).toLocaleDateString('fr-FR') 
          : '',
        'Date début crédit': bien.dateDebutCredit 
          ? new Date(bien.dateDebutCredit).toLocaleDateString('fr-FR') 
          : '',
      }
    })
    
    // 4. CRÉER LE WORKBOOK EXCEL
    // Import dynamique de XLSX pour réduire le bundle initial (~800KB)
    const XLSX = await import('xlsx')
    
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mes biens')
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 30 }, // Nom
      { wch: 15 }, // Type
      { wch: 40 }, // Adresse
      { wch: 12 }, // Code Postal
      { wch: 20 }, // Ville
      { wch: 15 }, // Prix d'achat
      { wch: 18 }, // Frais de notaire
      { wch: 18 }, // Travaux
      { wch: 15 }, // Autres frais
      { wch: 20 }, // Investissement total
      { wch: 18 }, // Montant crédit
      { wch: 15 }, // Taux crédit
      { wch: 18 }, // Durée crédit
      { wch: 18 }, // Mensualité
      { wch: 20 }, // Capital restant
      { wch: 18 }, // Loyer
      { wch: 20 }, // Taxe foncière
      { wch: 22 }, // Charges copro
      { wch: 18 }, // Assurance
      { wch: 20 }, // Frais gestion
      { wch: 20 }, // Autres charges
      { wch: 22 }, // Charges totales
      { wch: 18 }, // Rentabilité brute
      { wch: 18 }, // Rentabilité nette
      { wch: 20 }, // Cash-flow
      { wch: 18 }, // Date acquisition
      { wch: 22 }, // Date location
      { wch: 20 }, // Date crédit
    ]
    worksheet['!cols'] = colWidths
    
    // 5. GÉNÉRER LE BUFFER EXCEL
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // 5b. TRACK EXPORT EXCEL
    const profile = await getUserProfile(user.id, supabase)

    trackServerEvent(user.id, ANALYTICS_EVENTS.EXPORT_EXCEL, {
      bienCount: biens.length,
      planType: profile?.plan || 'gratuit',
    })

    logger.info('[API export-excel] Export réussi et tracké', {
      userId: user.id,
      nbBiens: biens.length,
    })
    
    // 6. RETOURNER LE FICHIER
    const filename = `Patrimoine_Immo_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    
  } catch (error: unknown) {
    logger.error('[API export-excel] Erreur:', error)
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'export Excel' },
      { status: 500 }
    )
  }
}
