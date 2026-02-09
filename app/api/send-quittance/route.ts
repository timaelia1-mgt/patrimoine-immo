import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { getBien } from '@/lib/database'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { ANALYTICS_EVENTS } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    // 1. VÉRIFIER L'AUTHENTIFICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('[API send-quittance] Tentative non authentifiée')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    // 2. RÉCUPÉRER LES DONNÉES
    const body = await request.json()
    const { 
      pdfBase64, 
      locataireEmail, 
      locataireNom, 
      locatairePrenom, 
      mois, 
      annee, 
      bienNom,
      bienId  // IMPORTANT : ajouter bienId pour vérifier la propriété
    } = body
    
    // 3. VALIDER LES DONNÉES OBLIGATOIRES
    if (!pdfBase64 || !locataireEmail || !bienId) {
      logger.error('[API send-quittance] Données manquantes')
      return NextResponse.json(
        { error: 'PDF, email et bienId requis' },
        { status: 400 }
      )
    }
    
    // 4. VÉRIFIER QUE LE BIEN APPARTIENT À L'UTILISATEUR
    const bien = await getBien(bienId, supabase)
    
    if (!bien) {
      logger.error('[API send-quittance] Bien introuvable', { bienId, userId: user.id })
      return NextResponse.json(
        { error: 'Bien introuvable' },
        { status: 404 }
      )
    }
    
    if (bien.userId !== user.id) {
      logger.error('[API send-quittance] Accès non autorisé', { 
        bienId, 
        bienUserId: bien.userId, 
        requestUserId: user.id 
      })
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    // 4b. VALIDATION NOM ET PRÉNOM
    if (!locataireNom || !locatairePrenom) {
      logger.error('[API send-quittance] Nom ou prénom manquant')
      return NextResponse.json(
        { error: 'Nom et prénom du locataire requis' },
        { status: 400 }
      )
    }
    
    if (locataireNom.length > 100 || locatairePrenom.length > 100) {
      logger.error('[API send-quittance] Nom ou prénom trop long')
      return NextResponse.json(
        { error: 'Nom et prénom trop longs (max 100 caractères)' },
        { status: 400 }
      )
    }
    
    // 5. VÉRIFIER LA CLÉ RESEND
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      logger.error('[API send-quittance] RESEND_API_KEY non configurée')
      return NextResponse.json(
        { error: 'Service email non configuré' },
        { status: 500 }
      )
    }
    
    // 6. VALIDER LE FORMAT EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(locataireEmail)) {
      logger.error('[API send-quittance] Email invalide', { locataireEmail })
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }
    
    // 6b. VALIDATION LONGUEUR EMAIL
    if (locataireEmail.length > 254) {
      logger.error('[API send-quittance] Email trop long', { 
        length: locataireEmail.length 
      })
      return NextResponse.json(
        { error: 'Email trop long (max 254 caractères)' },
        { status: 400 }
      )
    }
    
    // 7. VALIDER LA TAILLE DU PDF (max 10MB base64 ≈ 7.5MB PDF)
    if (pdfBase64.length > 10 * 1024 * 1024) {
      logger.error('[API send-quittance] PDF trop volumineux', { 
        size: pdfBase64.length 
      })
      return NextResponse.json(
        { error: 'PDF trop volumineux (max 7.5MB)' },
        { status: 400 }
      )
    }
    
    // 8. ENVOYER L'EMAIL VIA RESEND
    const resend = new Resend(resendApiKey)
    
    const MOIS_NOMS = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    
    logger.info('[API send-quittance] Envoi email', {
      userId: user.id,
      bienId,
      locataireEmail,
      mois,
      annee
    })
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev',
      to: [locataireEmail],
      subject: `Quittance de loyer - ${MOIS_NOMS[mois - 1]} ${annee} - ${bienNom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: #1e1e28; color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 22px;">Quittance de loyer</h1>
            <p style="margin: 8px 0 0; color: #b4b4c8; font-size: 14px;">
              ${MOIS_NOMS[mois - 1]} ${annee} - ${bienNom}
            </p>
          </div>
          
          <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #444; font-size: 15px; margin-top: 0;">
              Bonjour ${locatairePrenom} ${locataireNom},
            </p>
            
            <p style="color: #444; font-size: 15px;">
              Veuillez trouver ci-joint votre <strong>quittance de loyer</strong> pour la période de <strong>${MOIS_NOMS[mois - 1]} ${annee}</strong>.
            </p>
            
            <div style="background: #f0f0f5; border-left: 4px solid #22c55e; border-radius: 4px; padding: 16px; margin: 20px 0;">
              <p style="color: #22c55e; font-weight: bold; font-size: 16px; margin: 0;">
                ✓ Paiement confirmé
              </p>
              <p style="color: #666; font-size: 13px; margin: 8px 0 0;">
                Ce document atteste du paiement intégral de votre loyer.
              </p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin: 20px 0;">
              <p style="color: #92400e; font-weight: bold; font-size: 14px; margin: 0 0 8px;">
                ⚖️ Information légale
              </p>
              <p style="color: #78350f; font-size: 13px; margin: 0; line-height: 1.5;">
                Conformément à l'article 21 de la loi n°89-462 du 6 juillet 1989, la remise de cette quittance est gratuite. 
                Ce document a une valeur juridique comme preuve de paiement de loyer.
              </p>
            </div>
            
            <p style="color: #666; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Conservez précieusement cette quittance pour vos dossiers personnels.<br>
              <br>
              <strong style="color: #444;">Patrimo</strong> - Gestion Immobilière<br>
              <span style="font-size: 11px; color: #999;">
                Cet email et son contenu sont confidentiels. Si vous n'êtes pas le destinataire prévu, 
                merci de supprimer ce message et de prévenir l'expéditeur.
              </span>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `Quittance_${MOIS_NOMS[mois - 1]}_${annee}_${bienNom.replace(/\s+/g, '_')}.pdf`,
          contentType: 'application/pdf',
        },
      ],
    })
    
    if (error) {
      logger.error('[API send-quittance] Erreur Resend détaillée:', {
        message: error?.message,
        name: error?.name,
        statusCode: (error as any)?.statusCode,
        full: error
      })
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }
    
    // Track quittance sent
    trackServerEvent(user.id, ANALYTICS_EVENTS.QUITTANCE_SENT, {
      email: locataireEmail,
      mois,
      annee,
      bienId,
    })

    logger.info('[API send-quittance] Email envoyé et tracké', {
      userId: user.id,
      bienId,
      emailId: data?.id,
      locataireEmail,
    })

    // Sauvegarder la quittance en DB
    try {
      const { createQuittance } = await import('@/lib/database')
      
      await createQuittance({
        bienId,
        userId: user.id,
        mois,
        annee,
        locataireNom,
        locatairePrenom,
        locataireEmail,
        montantLocataire: parseFloat(body.montantLocataire || '0'),
        montantAPL: parseFloat(body.montantAPL || '0'),
        montantTotal: parseFloat(body.montantLocataire || '0') + parseFloat(body.montantAPL || '0'),
        datePayeLocataire: body.datePayeLocataire,
        datePayeAPL: body.datePayeAPL || null,
        modePaiement: body.modePaiement || 'virement',
        emailEnvoye: true,
        dateEnvoiEmail: new Date().toISOString(),
      }, supabase)
      
      logger.info('[API send-quittance] Quittance sauvegardée en DB', {
        userId: user.id,
        bienId,
        mois,
        annee
      })
    } catch (dbError: unknown) {
      // Log l'erreur mais ne pas faire échouer la requête
      // (l'email a déjà été envoyé avec succès)
      logger.error('[API send-quittance] Erreur sauvegarde DB:', dbError)
    }
    
    return NextResponse.json({ success: true, data })
    
  } catch (error: unknown) {
    logger.error('[API send-quittance] Erreur interne:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur inconnue'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
