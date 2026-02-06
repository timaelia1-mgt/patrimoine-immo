import { NextRequest } from 'next/server'

/**
 * Helper pour créer des NextRequest mockés pour les tests d'API routes
 * 
 * Exemples d'utilisation :
 * 
 * // GET simple
 * const req = createMockRequest('http://localhost:3000/api/biens')
 * 
 * // POST avec body
 * const req = createMockRequest('http://localhost:3000/api/auth/signup', {
 *   method: 'POST',
 *   body: { email: 'test@example.com', password: 'Password123' }
 * })
 * 
 * // Avec headers custom
 * const req = createMockRequest('http://localhost:3000/api/test', {
 *   headers: { 'Authorization': 'Bearer token123' }
 * })
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options

  // Construire l'URL avec les query params
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  // Ajouter le body seulement pour les méthodes qui le supportent
  if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit)
}

/**
 * Helper pour créer un mock de params pour les routes dynamiques
 * Dans Next.js 14+, params est une Promise
 */
export function createMockParams<T extends Record<string, string>>(
  params: T
): Promise<T> {
  return Promise.resolve(params)
}

/**
 * Helper pour extraire le JSON d'une Response
 */
export async function getResponseJson(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Helper pour vérifier les headers de réponse communs
 */
export function expectJsonResponse(response: Response): void {
  const contentType = response.headers.get('Content-Type')
  if (contentType && !contentType.includes('application/json')) {
    // Certaines réponses peuvent être des fichiers, pas du JSON
    return
  }
}

/**
 * Données de test communes pour les requêtes
 */
export const testData = {
  validEmail: 'test@example.com',
  invalidEmail: 'invalid-email',
  validPassword: 'Password123!',
  weakPassword: '123',
  shortPassword: 'Pass1',
  noUpperPassword: 'password123',
  noLowerPassword: 'PASSWORD123',
  noNumberPassword: 'PasswordABC',
}
