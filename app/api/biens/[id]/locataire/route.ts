import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBien, getLocataires, upsertLocataire } from '@/lib/database'
import { logger } from '@/lib/logger'
import { UpsertLocataireSchema } from '@/lib/schemas'

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
    
    // Récupérer les infos des locataires
    const locataires = await getLocataires(id)
    // Rétrocompatibilité : retourne le premier locataire sous la clé "locataire"
    const locataire = locataires.length > 0 ? locataires[0] : null
    
    return NextResponse.json({ locataire, locataires })
  } catch (error: unknown) {
    logger.error('[API getLocataires] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const requestBody = await request.json()

    // Validate request body with Zod
    const validation = UpsertLocataireSchema.safeParse(requestBody)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors

      logger.warn('[Upsert Locataire] Validation failed', {
        userId: user.id,
        bienId: id,
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
    
    // Récupérer le lot par défaut du bien
    const { data: defaultLot } = await supabase
      .from("lots")
      .select("id")
      .eq("bien_id", id)
      .eq("est_lot_defaut", true)
      .single()

    if (!defaultLot) {
      return NextResponse.json(
        { error: "Aucun lot par défaut trouvé" },
        { status: 404 }
      )
    }

    // Upsert locataire with validated and type-safe data
    await upsertLocataire(id, defaultLot.id, {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email || null,
      telephone: body.telephone || null,
      dateEntree: body.dateEntree || null,
      montantAPL: body.montantAPL ?? 0,
      modePaiement: body.modePaiement ?? 'virement',
    })
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('[API upsertLocataire] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
