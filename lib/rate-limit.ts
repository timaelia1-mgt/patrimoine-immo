interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = identifier.toLowerCase().trim()

  // Nettoyer les entrées expirées
  if (store[key] && store[key].resetAt < now) {
    delete store[key]
  }

  // Initialiser si nécessaire
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetAt: now + config.windowMs
    }
  }

  const entry = store[key]

  // Vérifier la limite
  if (entry.count >= config.maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Incrémenter
  entry.count++

  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.resetAt
  }
}

export function getRateLimitInfo(identifier: string): {
  count: number
  resetAt: number
} | null {
  const key = identifier.toLowerCase().trim()
  const now = Date.now()

  if (store[key] && store[key].resetAt > now) {
    return store[key]
  }

  return null
}
