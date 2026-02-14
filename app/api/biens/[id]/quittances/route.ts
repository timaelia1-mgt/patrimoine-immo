import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBien, createQuittance, getQuittancesByBien } from '@/lib/database'
import { logger } from '@/lib/logger'
import { CreateQuittanceSchema } from '@/lib/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    
    // Vérifier que le bien appartient à l'utilisateur
    const bien = await getBien(id, supabase)
    
    if (!bien) {
      return NextResponse.json(
        { error: 'Bien introuvable' },
        { status: 404 }
      )
    }
    
    if (bien.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    // Récupérer les quittances du bien (passer le client serveur pour RLS)
    const quittances = await getQuittancesByBien(id, supabase)
    
    return NextResponse.json({ quittances })
  } catch (error: unknown) {
    logger.error('[API getQuittances] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const { id: bienId } = await params
    
    // Vérifier que le bien appartient à l'utilisateur
    const bien = await getBien(bienId, supabase)
    
    if (!bien) {
      return NextResponse.json(
        { error: 'Bien introuvable' },
        { status: 404 }
      )
    }
    
    if (bien.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate request body with Zod
    const requestBody = await request.json()
    const validation = CreateQuittanceSchema.safeParse(requestBody)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors

      logger.warn('[Create Quittance] Validation failed', {
        userId: user.id,
        bienId,
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

    const body = validation.data

    // Créer la quittance avec données validées et type-safe
    const montantAPL = body.montantAPL ?? 0
    const quittance = await createQuittance({
      bienId,
      userId: user.id,
      mois: body.mois,
      annee: body.annee,
      locataireNom: body.locataireNom,
      locatairePrenom: body.locatairePrenom,
      locataireEmail: body.locataireEmail || null,
      montantLocataire: body.montantLocataire,
      montantAPL,
      montantTotal: body.montantLocataire + montantAPL,
      datePayeLocataire: body.datePayeLocataire,
      datePayeAPL: body.datePayeAPL || null,
      modePaiement: body.modePaiement,
      emailEnvoye: body.emailEnvoye ?? false,
      dateEnvoiEmail: body.dateEnvoiEmail || null,
    }, supabase)
    
    logger.info('[API createQuittance] Quittance créée', {
      userId: user.id,
      bienId,
      quittanceId: quittance.id,
      mois: body.mois,
      annee: body.annee,
    })
    
    return NextResponse.json({ quittance })
  } catch (error: unknown) {
    logger.error('[API createQuittance] Erreur:', error)
    
    // Si c'est une erreur de contrainte unique (quittance déjà existante)
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('unique_quittance_bien_mois_annee')) {
      return NextResponse.json(
        { error: 'Une quittance existe déjà pour ce mois' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
