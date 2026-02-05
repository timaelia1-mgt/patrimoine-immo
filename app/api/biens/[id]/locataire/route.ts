import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBien, getLocataire, upsertLocataire } from '@/lib/database'
import { logger } from '@/lib/logger'

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
    
    // Récupérer les infos du locataire
    const locataire = await getLocataire(id)
    
    return NextResponse.json({ locataire })
  } catch (error: unknown) {
    logger.error('[API getLocataire] Erreur:', error)
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
    const body = await request.json()
    
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
    
    // Valider que nom et prénom sont fournis
    if (!body.nom || !body.prenom) {
      return NextResponse.json(
        { error: 'Le nom et le prénom sont obligatoires' },
        { status: 400 }
      )
    }
    
    // Upsert locataire
    await upsertLocataire(id, {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email || null,
      telephone: body.telephone || null,
      dateEntree: body.dateEntree || null,
      montantAPL: parseFloat(body.montantAPL || '0'),
      modePaiement: body.modePaiement || 'virement',
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
