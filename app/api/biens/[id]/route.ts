import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBien, updateBien } from '@/lib/database'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'
import { UpdateBienSchema } from '@/lib/schemas'

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
    const bien = await getBien(id, supabase)
    
    if (!bien) {
      return NextResponse.json(
        { error: 'Bien introuvable' },
        { status: 404 }
      )
    }
    
    // Vérifier que le bien appartient à l'utilisateur
    if (bien.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ bien })
  } catch (error: unknown) {
    logger.error('[API getBien] Erreur:', error)
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
    const validation = UpdateBienSchema.safeParse(requestBody)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors

      logger.warn('[Update Bien] Validation failed', {
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
    
    // Mettre à jour le bien avec données validées (updateBien gère camelCase → snake_case)
    await updateBien(id, body, supabase)

    // Track bien updated
    trackServerEvent(user.id, ANALYTICS_EVENTS.BIEN_UPDATED, {
      bienId: id,
      fieldsUpdated: Object.keys(body),
    })
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('[API updateBien] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
