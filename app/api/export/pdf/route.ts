import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBiens, getUserProfile } from '@/lib/database'
import { logger } from '@/lib/logger'
import { generateRapportAnnuelPDF } from '@/lib/generateRapportAnnuel'
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export async function GET() {
  try {
    // 1. VÉRIFIER L'AUTHENTIFICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('[API export-pdf] Tentative non authentifiée')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    logger.info('[API export-pdf] Export PDF demandé', { userId: user.id })
    
    // 2. RÉCUPÉRER LE PROFIL
    const profile = await getUserProfile(user.id, supabase)
    
    // 3. RÉCUPÉRER TOUS LES BIENS
    const biens = await getBiens(user.id, supabase)
    
    if (!biens || biens.length === 0) {
      logger.info('[API export-pdf] Aucun bien à exporter', { userId: user.id })
      return NextResponse.json(
        { 
          error: 'Aucun bien à exporter',
          message: 'Vous n\'avez aucun bien à exporter. Ajoutez d\'abord des biens depuis le dashboard.'
        },
        { status: 404 }
      )
    }
    
    // 4. PRÉPARER LES DONNÉES POUR LE RAPPORT
    const biensData = biens.map((bien) => {
      // Calcul investissement total
      const investissementTotal = (
        (bien.prixAchat || 0) + 
        (bien.fraisNotaire || 0) + 
        (bien.travauxInitiaux || 0) + 
        (bien.autresFrais || 0)
      )
      
      // Calcul charges mensuelles totales
      const chargesMensuelles = (
        (bien.taxeFonciere || 0) +
        (bien.chargesCopro || 0) +
        (bien.assurance || 0) +
        (bien.fraisGestion || 0) +
        (bien.autresCharges || 0)
      )
      
      // Mensualité crédit (seulement si type CREDIT)
      const mensualiteCredit = bien.typeFinancement === 'CREDIT' 
        ? (bien.mensualiteCredit || 0) 
        : 0
      
      // Calcul rentabilité brute
      const rentabiliteBrute = investissementTotal > 0 
        ? ((bien.loyerMensuel || 0) * 12 / investissementTotal) * 100 
        : 0
      
      // Calcul rentabilité nette (loyer - charges) / investissement
      const rentabiliteNette = investissementTotal > 0 
        ? (((bien.loyerMensuel || 0) - chargesMensuelles) * 12 / investissementTotal) * 100 
        : 0
      
      return {
        nom: bien.nom || 'Sans nom',
        typeFinancement: bien.typeFinancement || 'CASH',
        adresse: bien.adresse || '',
        ville: bien.ville || '',
        loyerMensuel: bien.loyerMensuel || 0,
        chargesMensuelles,
        mensualiteCredit,
        investissementTotal,
        rentabiliteBrute: Math.round(rentabiliteBrute * 10) / 10,
        rentabiliteNette: Math.round(rentabiliteNette * 10) / 10,
      }
    })
    
    // 5. CALCULER LES STATISTIQUES GLOBALES
    const stats = {
      nbBiens: biens.length,
      patrimoineTotal: biensData.reduce((sum, b) => sum + b.investissementTotal, 0),
      loyersAnnuels: biensData.reduce((sum, b) => sum + (b.loyerMensuel * 12), 0),
      chargesAnnuelles: biensData.reduce((sum, b) => sum + ((b.chargesMensuelles + b.mensualiteCredit) * 12), 0),
      cashFlowAnnuel: biensData.reduce((sum, b) => sum + ((b.loyerMensuel - b.chargesMensuelles - b.mensualiteCredit) * 12), 0),
      rentabiliteMoyenne: biensData.length > 0 
        ? biensData.reduce((sum, b) => sum + b.rentabiliteNette, 0) / biensData.length 
        : 0,
    }
    
    // 6. GÉNÉRER LE PDF
    const rapportData = {
      proprietaireNom: profile?.name || user.email || 'Propriétaire',
      annee: new Date().getFullYear(),
      biens: biensData,
      stats,
    }
    
    const doc = generateRapportAnnuelPDF(rapportData)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    // Track export PDF
    trackServerEvent(user.id, ANALYTICS_EVENTS.EXPORT_PDF, {
      bienCount: biens.length,
      annee: new Date().getFullYear(),
      planType: profile?.plan || 'gratuit',
    })

    logger.info('[API export-pdf] Export réussi et tracké', {
      userId: user.id,
      nbBiens: biens.length,
      patrimoineTotal: stats.patrimoineTotal,
    })
    
    // 7. RETOURNER LE FICHIER
    const filename = `Rapport_Annuel_${new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    
  } catch (error: unknown) {
    logger.error('[API export-pdf] Erreur:', error)
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'export PDF' },
      { status: 500 }
    )
  }
}
