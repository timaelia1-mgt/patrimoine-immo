# Guidelines de Tests

Ce document décrit les bonnes pratiques pour écrire des tests dans Patrimoine Immo.

## 📋 Quand ajouter des tests

### Obligatoire ✅
- Nouvelles fonctions dans `lib/`
- Nouvelles routes API
- Logique métier complexe
- Calculs financiers

### Recommandé 👍
- Composants avec logique d'état
- Validations de formulaires
- Fonctions de transformation de données

### Optionnel ⚡
- Composants UI simples (boutons, inputs)
- Wrappers de librairies externes
- Styles et layouts

## 🏗️ Structure d'un test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('NomDuModule', () => {
  beforeEach(() => {
    // Reset des mocks avant chaque test
    vi.clearAllMocks()
  })

  describe('nomDeLaFonction', () => {
    it('devrait faire X quand Y', () => {
      // Arrange - Préparer les données
      const input = { ... }
      
      // Act - Exécuter la fonction
      const result = maFonction(input)
      
      // Assert - Vérifier le résultat
      expect(result).toBe(expected)
    })

    it('devrait gérer l\'erreur Z', async () => {
      // Arrange
      const mockError = new Error('Erreur')
      
      // Act & Assert
      await expect(maFonction()).rejects.toThrow('Erreur')
    })
  })
})
```

## 🔌 Mocking Supabase

Utilise le mock chainable de `__tests__/mocks/supabase.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabaseClient, resetSupabaseMocks } from '../mocks/supabase'

// Mock du module Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('MaFonction', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  it('devrait récupérer les données', async () => {
    // Configurer le mock
    mockSupabaseClient.select.mockResolvedValueOnce({ 
      data: [{ id: '1', nom: 'Test' }], 
      error: null 
    })

    // Appeler la fonction
    const result = await maFonction()

    // Vérifier
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('ma_table')
    expect(result).toHaveLength(1)
  })
})
```

### Mock chainable

Pour les appels Supabase chainés (`.from().select().eq().single()`), utilise `createChainableMock` :

```typescript
function createChainableMock(finalResult: { data: any; error: any }) {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(finalResult)),
  }
  return mock
}
```

## 🖥️ Mocking des routes API

Utilise les helpers de `__tests__/mocks/nextRequest.ts` :

```typescript
import { createMockRequest, createMockRequestWithUser } from '../mocks/nextRequest'

describe('API Route', () => {
  it('devrait retourner 200', async () => {
    const request = createMockRequestWithUser('user-123', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'bien-123' } })

    expect(response.status).toBe(200)
  })
})
```

## ⚛️ Tests de composants React

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonComposant } from '@/components/MonComposant'

// Mock des dépendances
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}))

describe('MonComposant', () => {
  it('devrait afficher le titre', () => {
    render(<MonComposant />)
    
    expect(screen.getByText('Mon Titre')).toBeInTheDocument()
  })

  it('devrait appeler onClick au clic', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    
    render(<MonComposant onClick={onClick} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('devrait charger les données', async () => {
    render(<MonComposant />)
    
    await waitFor(() => {
      expect(screen.getByText('Données chargées')).toBeInTheDocument()
    })
  })
})
```

## 🎯 Objectifs de coverage

| Module | Objectif | Priorité |
|--------|----------|----------|
| `lib/calculations.ts` | 90%+ | 🔴 Critique |
| `lib/database.ts` | 85%+ | 🔴 Critique |
| Routes API | 80%+ | 🟠 Haute |
| Composants critiques | 70%+ | 🟡 Moyenne |
| Composants UI | N/A | ⚪ Basse |

## 📝 Conventions de nommage

### Fichiers de test
- `nomDuFichier.test.ts` pour les fichiers TypeScript
- `NomDuComposant.test.tsx` pour les composants React

### Descriptions de tests
- Utiliser le français
- Format : `devrait [action] quand [condition]`
- Exemples :
  - `devrait retourner le cash-flow calculé`
  - `devrait lever une erreur si l'email est invalide`
  - `devrait afficher le loader pendant le chargement`

## 🔧 Commandes utiles

```bash
# Lancer un test spécifique
npm run test -- calculations

# Lancer les tests d'un dossier
npm run test -- __tests__/lib

# Tests avec coverage détaillé
npm run test:coverage

# Debug un test
npm run test -- --reporter=verbose calculations
```

## 🚨 Résolution de problèmes

### "Target container is not a DOM element"
Les mocks de `document.createElement` interfèrent avec React Testing Library.
**Solution** : Restaurer les fonctions originales après chaque test.

### "Cannot access 'mockX' before initialization"
Le mock est défini après le `vi.mock()` mais utilisé dans le factory.
**Solution** : Définir le mock dans le factory directement.

### Tests asynchrones qui timeout
**Solution** : Utiliser `waitFor` ou augmenter le timeout :
```typescript
it('test long', async () => {
  // ...
}, 10000) // 10 secondes
```
