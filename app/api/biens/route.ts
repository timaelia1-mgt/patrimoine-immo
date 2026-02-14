import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAddBien, getPlanMaxBiens, isValidPlanType } from '@/lib/stripe'
import type { PlanType } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'
import { CreateBienSchema } from '@/lib/schemas'

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

    // Parse and validate request body with Zod
    const body = await request.json()
    const validation = CreateBienSchema.safeParse(body)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors

      logger.warn('[Create Bien] Validation failed', {
        userId: user.id,
        errors: fieldErrors,
      })

      return NextResponse.json(
        {
          error: 'Données invalides',
          details: fieldErrors,
        },
        { status: 400 }
      )
    }

    // Data is now validated, sanitized, and type-safe
    const bienData = validation.data

    // Convert typeFinancement to Supabase format
    const typeFinancement = bienData.typeFinancement === 'CREDIT' ? 'credit' : 'comptant'

    // Calculate total monthly charges
    const taxeFonciere = bienData.taxeFonciere ?? 0
    const chargesCopro = bienData.chargesCopro ?? 0
    const assurance = bienData.assurance ?? 0
    const fraisGestion = bienData.fraisGestion ?? 0
    const autresCharges = bienData.autresCharges ?? 0
    const chargesMensuelles = taxeFonciere + chargesCopro + assurance + fraisGestion + autresCharges

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      nom: bienData.nom,
      adresse: bienData.adresse,
      ville: bienData.ville,
      code_postal: bienData.codePostal,
      type_financement: typeFinancement,
      prix_achat: 0,
      frais_notaire: 0,
      travaux_initiaux: 0,
      apport: 0,
      loyer_mensuel: bienData.loyerMensuel,
      taxe_fonciere: taxeFonciere,
      charges_copro: chargesCopro,
      assurance: assurance,
      frais_gestion: fraisGestion,
      autres_charges: autresCharges,
      charges_mensuelles: chargesMensuelles,
    }

    // Add credit fields based on financing type
    if (bienData.typeFinancement === 'CREDIT') {
      insertData.montant_credit = bienData.montantCredit
      insertData.taux_credit = bienData.tauxCredit
      insertData.duree_credit = bienData.dureeCredit
      insertData.mensualite_credit = bienData.mensualiteCredit ?? null
      insertData.date_debut_credit = bienData.dateDebutCredit || null
    } else {
      insertData.montant_credit = null
      insertData.taux_credit = null
      insertData.duree_credit = null
      insertData.mensualite_credit = null
      insertData.date_debut_credit = null
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
