import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBien, createQuittance, getQuittancesByBien } from '@/lib/database'
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
    
    // Récupérer les quittances du bien
    const quittances = await getQuittancesByBien(id)
    
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
    const body = await request.json()
    
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
    
    // Valider les données obligatoires
    const {
      mois,
      annee,
      locataireNom,
      locatairePrenom,
      locataireEmail,
      montantLocataire,
      montantAPL,
      datePayeLocataire,
      datePayeAPL,
      modePaiement,
      emailEnvoye,
      dateEnvoiEmail,
    } = body
    
    // Validation des champs obligatoires
    if (!mois || !annee || !locataireNom || !locatairePrenom || montantLocataire === undefined || !datePayeLocataire || !modePaiement) {
      logger.error('[API createQuittance] Données manquantes', { body })
      return NextResponse.json(
        { error: 'Données obligatoires manquantes' },
        { status: 400 }
      )
    }
    
    // Validation mois (1-12)
    if (mois < 1 || mois > 12) {
      logger.error('[API createQuittance] Mois invalide', { mois })
      return NextResponse.json(
        { error: 'Le mois doit être entre 1 et 12' },
        { status: 400 }
      )
    }
    
    // Validation année (entre 2000 et 2100)
    if (annee < 2000 || annee > 2100) {
      logger.error('[API createQuittance] Année invalide', { annee })
      return NextResponse.json(
        { error: 'L\'année doit être entre 2000 et 2100' },
        { status: 400 }
      )
    }
    
    // Validation montants (positifs)
    if (parseFloat(montantLocataire) < 0 || parseFloat(montantAPL || '0') < 0) {
      logger.error('[API createQuittance] Montants négatifs', { montantLocataire, montantAPL })
      return NextResponse.json(
        { error: 'Les montants doivent être positifs' },
        { status: 400 }
      )
    }
    
    // Validation format date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(datePayeLocataire)) {
      logger.error('[API createQuittance] Format date invalide', { datePayeLocataire })
      return NextResponse.json(
        { error: 'Format de date invalide (attendu: YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    
    // Validation mode paiement
    const modesValides = ['virement', 'cheque', 'especes', 'prelevement']
    if (!modesValides.includes(modePaiement)) {
      logger.error('[API createQuittance] Mode paiement invalide', { modePaiement })
      return NextResponse.json(
        { error: 'Mode de paiement invalide' },
        { status: 400 }
      )
    }
    
    // Créer la quittance
    const quittance = await createQuittance({
      bienId,
      mois,
      annee,
      locataireNom,
      locatairePrenom,
      locataireEmail: locataireEmail || null,
      montantLocataire: parseFloat(montantLocataire),
      montantAPL: parseFloat(montantAPL || '0'),
      montantTotal: parseFloat(montantLocataire) + parseFloat(montantAPL || '0'),
      datePayeLocataire,
      datePayeAPL: datePayeAPL || null,
      modePaiement: modePaiement || 'virement',
      emailEnvoye: emailEnvoye || false,
      dateEnvoiEmail: dateEnvoiEmail || null,
    })
    
    logger.info('[API createQuittance] Quittance créée', {
      userId: user.id,
      bienId,
      quittanceId: quittance.id,
      mois,
      annee
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
