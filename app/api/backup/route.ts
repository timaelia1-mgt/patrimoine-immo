import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBiens, getUserProfile } from '@/lib/database'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // 1. VÉRIFIER L'AUTHENTIFICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('[API backup] Tentative non authentifiée')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    logger.info('[API backup] Backup demandé', { userId: user.id })
    
    // 2. RÉCUPÉRER TOUTES LES DONNÉES
    const profile = await getUserProfile(user.id, supabase)
    const biens = await getBiens(user.id, supabase)
    
    const bienIds = biens?.map(b => b.id) || []
    
    // Récupérer les quittances
    const { data: quittances, error: quittancesError } = await supabase
      .from('quittances')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (quittancesError) {
      logger.warn('[API backup] Erreur récupération quittances:', quittancesError)
    }
    
    // Récupérer les loyers (seulement si on a des biens)
    let loyers: any[] = []
    if (bienIds.length > 0) {
      const { data: loyersData, error: loyersError } = await supabase
        .from('loyers')
        .select('*')
        .in('bien_id', bienIds)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })
      
      if (loyersError) {
        logger.warn('[API backup] Erreur récupération loyers:', loyersError)
      } else {
        loyers = loyersData || []
      }
    }
    
    // Récupérer les locataires
    let locataires: any[] = []
    if (bienIds.length > 0) {
      const { data: locatairesData, error: locatairesError } = await supabase
        .from('locataires')
        .select('*')
        .in('bien_id', bienIds)
      
      if (locatairesError) {
        logger.warn('[API backup] Erreur récupération locataires:', locatairesError)
      } else {
        locataires = locatairesData || []
      }
    }
    
    // Récupérer les investissements secondaires
    let investissements: any[] = []
    if (bienIds.length > 0) {
      const { data: investissementsData, error: investissementsError } = await supabase
        .from('investissements_secondaires')
        .select('*')
        .in('bien_id', bienIds)
        .order('date', { ascending: false })
      
      if (investissementsError) {
        logger.warn('[API backup] Erreur récupération investissements:', investissementsError)
      } else {
        investissements = investissementsData || []
      }
    }
    
    // 3. CRÉER L'OBJET DE BACKUP
    const backup = {
      _metadata: {
        version: '1.0',
        application: 'Patrimoine Immo',
        createdAt: new Date().toISOString(),
        format: 'json',
      },
      user: {
        id: user.id,
        email: user.email,
        profile: profile ? {
          name: profile.name,
          plan: profile.plan,
          currency: profile.currency,
          rentPaymentDay: profile.rentPaymentDay,
          paymentDelayDays: profile.paymentDelayDays,
          emailAlertsEnabled: profile.emailAlertsEnabled,
          appNotificationsEnabled: profile.appNotificationsEnabled,
        } : null,
      },
      data: {
        biens: biens || [],
        quittances: quittances || [],
        loyers: loyers,
        locataires: locataires,
        investissementsSecondaires: investissements,
      },
      statistics: {
        totalBiens: biens?.length || 0,
        totalQuittances: quittances?.length || 0,
        totalLoyers: loyers.length,
        totalLocataires: locataires.length,
        totalInvestissementsSecondaires: investissements.length,
        patrimoineTotal: biens?.reduce((sum, b) => {
          return sum + (b.prixAchat || 0) + (b.fraisNotaire || 0) + (b.travauxInitiaux || 0) + (b.autresFrais || 0)
        }, 0) || 0,
        loyersMensuelsTotal: biens?.reduce((sum, b) => sum + (b.loyerMensuel || 0), 0) || 0,
      }
    }
    
    logger.info('[API backup] Backup créé avec succès', {
      userId: user.id,
      stats: backup.statistics
    })
    
    // 4. RETOURNER LE JSON
    const filename = `Backup_Patrimoine_Immo_${new Date().toISOString().split('T')[0]}.json`
    const jsonString = JSON.stringify(backup, null, 2)
    
    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    
  } catch (error: unknown) {
    logger.error('[API backup] Erreur:', error)
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du backup' },
      { status: 500 }
    )
  }
}
