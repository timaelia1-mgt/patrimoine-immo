import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const { pdfBase64, locataireEmail, locataireNom, locatairePrenom, mois, annee, bienNom } = await request.json()

    if (!pdfBase64 || !locataireEmail) {
      return NextResponse.json({ error: 'PDF et email requis' }, { status: 400 })
    }

    // Instancier Resend dans la fonction pour éviter le crash au build
    const resend = new Resend(process.env.RESEND_API_KEY)

    const MOIS_NOMS = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev',
      to: [locataireEmail],
      subject: `Quittance de loyer - ${MOIS_NOMS[mois - 1]} ${annee} - ${bienNom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1e1e28; color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 22px;">Quittance de loyer</h1>
            <p style="margin: 8px 0 0; color: #b4b4c8; font-size: 14px;">
              ${MOIS_NOMS[mois - 1]} ${annee} - ${bienNom}
            </p>
          </div>
          
          <p style="color: #444; font-size: 15px;">
            Bonjour ${locatairePrenom} ${locataireNom},
          </p>
          
          <p style="color: #444; font-size: 15px;">
            Veuillez trouver ci-joint votre quittance de loyer pour la période de <strong>${MOIS_NOMS[mois - 1]} ${annee}</strong>.
          </p>
          
          <div style="background: #f0f0f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #22c55e; font-weight: bold; font-size: 16px; margin: 0;">
              ✓ Paiement confirmé
            </p>
          </div>
          
          <p style="color: #666; font-size: 13px; margin-top: 30px;">
            Ce document a une valeur juridique comme preuve de paiement.<br>
            Envoyé par <strong>Patrimo</strong> - Gestion Immobilière
          </p>
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
