export function sanitizeAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Une erreur inattendue est survenue'
  }

  const message = error.message.toLowerCase()

  // Mapping des erreurs Supabase vers messages user-friendly
  if (message.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect'
  }

  if (message.includes('email not confirmed')) {
    return 'Veuillez confirmer votre email avant de vous connecter'
  }

  if (message.includes('user already registered')) {
    return 'Cet email est déjà utilisé'
  }

  if (message.includes('invalid email')) {
    return "Format d'email invalide"
  }

  if (message.includes('password')) {
    return 'Le mot de passe ne respecte pas les critères requis'
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Problème de connexion. Vérifiez votre connexion internet.'
  }

  if (message.includes('expired')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }

  if (message.includes('invalid') && message.includes('otp')) {
    return 'Code invalide. Vérifiez et réessayez.'
  }

  // Message générique pour tout le reste (ne jamais exposer les détails)
  return 'Une erreur est survenue. Veuillez réessayer.'
}
