import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis', valid: false },
        { status: 400 }
      )
    }

    // Validation longueur
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères', valid: false },
        { status: 400 }
      )
    }

    // Validation complexité
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { 
          error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
          valid: false 
        },
        { status: 400 }
      )
    }

    // Validation mots de passe communs (optionnel mais recommandé)
    const commonPasswords = ['password', 'Password123', '12345678', 'azerty123']
    if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
      return NextResponse.json(
        { error: 'Ce mot de passe est trop commun', valid: false },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Erreur serveur', valid: false },
      { status: 500 }
    )
  }
}
