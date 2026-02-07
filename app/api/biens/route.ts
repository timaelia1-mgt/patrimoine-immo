import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAddBien, getPlanMaxBiens, isValidPlanType } from '@/lib/stripe'
import type { PlanType } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le profil avec le plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Compter les biens actuels
    const { count: biensCount } = await supabase
      .from('biens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const currentBiensCount = biensCount || 0
    const planType: PlanType = isValidPlanType(profile.plan_type) ? profile.plan_type : 'gratuit'

    // Vérifier la limite avec la fonction utilitaire
    if (!canAddBien(planType, currentBiensCount)) {
      const maxBiens = getPlanMaxBiens(planType)

      // Track limite atteinte
      trackServerEvent(user.id, ANALYTICS_EVENTS.BIEN_LIMIT_REACHED, {
        planType,
        currentCount: currentBiensCount,
        maxCount: maxBiens!,
      })

      logger.warn('[Create Bien] Limite atteinte', {
        userId: user.id,
        planType,
        currentBiens: currentBiensCount,
        maxBiens,
      })

      return NextResponse.json(
        {
          error: 'Limite de biens atteinte',
          message: `Votre plan ${planType} permet jusqu'à ${maxBiens} bien${maxBiens! > 1 ? 's' : ''}. Passez à un plan supérieur pour ajouter plus de biens.`,
          currentCount: currentBiensCount,
          maxCount: maxBiens,
          planType,
        },
        { status: 403 }
      )
    }

    // Créer le bien
    const bienData = await request.json()

    // Convertir typeFinancement en format Supabase
    const typeFinancement = bienData.typeFinancement === 'CREDIT' ? 'credit' : 'comptant'

    const taxeFonciere = parseFloat(bienData.taxeFonciere?.toString() || '0') || 0
    const chargesCopro = parseFloat(bienData.chargesCopro?.toString() || '0') || 0
    const assurance = parseFloat(bienData.assurance?.toString() || '0') || 0
    const fraisGestion = parseFloat(bienData.fraisGestion?.toString() || '0') || 0
    const autresCharges = parseFloat(bienData.autresCharges?.toString() || '0') || 0
    const chargesMensuelles = taxeFonciere + chargesCopro + assurance + fraisGestion + autresCharges

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      nom: (bienData.nom || '').trim().substring(0, 100),
      adresse: (bienData.adresse || '').trim().substring(0, 200),
      ville: (bienData.ville || '').trim().substring(0, 100),
      code_postal: (bienData.codePostal || '').trim().substring(0, 10),
      type_financement: typeFinancement,
      prix_achat: bienData.prixAchat ? parseFloat(bienData.prixAchat.toString()) : 0,
      frais_notaire: bienData.fraisNotaire ? parseFloat(bienData.fraisNotaire.toString()) : 0,
      travaux_initiaux: bienData.travauxInitiaux ? parseFloat(bienData.travauxInitiaux.toString()) : 0,
      montant_credit: bienData.montantCredit ? parseFloat(bienData.montantCredit.toString()) : null,
      taux_credit: bienData.tauxCredit ? parseFloat(bienData.tauxCredit.toString()) : null,
      duree_credit: bienData.dureeCredit ? parseInt(bienData.dureeCredit.toString()) : null,
      mensualite_credit: bienData.mensualiteCredit ? parseFloat(bienData.mensualiteCredit.toString()) : null,
      apport: 0,
      loyer_mensuel: bienData.loyerMensuel ? parseFloat(bienData.loyerMensuel.toString()) : 0,
      taxe_fonciere: taxeFonciere,
      charges_copro: chargesCopro,
      assurance: assurance,
      frais_gestion: fraisGestion,
      autres_charges: autresCharges,
      charges_mensuelles: chargesMensuelles,
      date_debut_credit: bienData.dateDebutCredit ? new Date(bienData.dateDebutCredit).toISOString() : null,
    }

    const { data: bien, error: insertError } = await supabase
      .from('biens')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      logger.error('[Create Bien] Erreur insertion:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du bien' },
        { status: 500 }
      )
    }

    // Track bien created
    trackServerEvent(user.id, ANALYTICS_EVENTS.BIEN_CREATED, {
      planType,
      bienCount: currentBiensCount + 1,
      financement: typeFinancement,
    })

    logger.info('[Create Bien] Bien créé et event tracké', {
      userId: user.id,
      bienId: bien.id,
      planType,
      biensCount: currentBiensCount + 1,
    })

    return NextResponse.json({ bien }, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    logger.error('[Create Bien] Erreur:', { error: err.message })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
