import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier la clé Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("[API email/send] RESEND_API_KEY non configurée")
      return NextResponse.json(
        { error: "Service email non configuré" },
        { status: 500 }
      )
    }

    // 2. Authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // 3. Récupérer les données
    const { to, subject, html, replyTo } = await request.json()

    // 4. Validation
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Champs requis : to, subject, html" },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      )
    }

    // 5. Envoyer l'email via Resend
    const resend = new Resend(resendApiKey)
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Patrimoine Immo <noreply@patrimo.dev>",
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo || undefined,
    })

    if (error) {
      console.error("Erreur Resend:", error)
      return NextResponse.json(
        { error: error.message || "Erreur lors de l'envoi" },
        { status: 500 }
      )
    }

    // 5. Succès
    return NextResponse.json({ 
      success: true, 
      messageId: data?.id 
    })

  } catch (error: any) {
    console.error("Erreur envoi email:", error)
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
