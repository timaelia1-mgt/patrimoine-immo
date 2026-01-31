# 🔍 AUDIT COMPLET : Appels API obsolètes et bugs

## 📊 RÉSUMÉ EXÉCUTIF

**Total de fichiers problématiques : 8**
- ❌ 6 fichiers avec appels API inexistants
- ⚠️ 7 fichiers avec `window.location.reload()` problématique
- ❌ 0 routes API existantes dans `app/api/`

---

## ❌ FICHIERS PROBLÉMATIQUES - Appels API inexistants

### 1. `components/biens/Loyers.tsx`

**Problèmes identifiés :**
- **Ligne 34** : `fetch('/api/biens/${bien.id}/locataire')` - GET
  - ❌ Route n'existe pas
  - Solution : Créer `getLocataire(bienId)` dans `database.ts` ou utiliser directement Supabase
  
- **Ligne 42** : `fetch('/api/biens/${bien.id}/loyers?annee=${annee}')` - GET
  - ❌ Route n'existe pas
  - Solution : Créer `getLoyers(bienId, annee)` dans `database.ts`
  
- **Ligne 110** : `fetch('/api/biens/${bien.id}/loyers', { method: 'POST' })` - POST
  - ❌ Route n'existe pas
  - Solution : Créer `upsertLoyer(bienId, annee, mois, paiement)` dans `database.ts`

**Impact :** Le composant Loyers ne peut pas charger ni sauvegarder les données de paiement.

---

### 2. `components/biens/Locataire.tsx`

**Problèmes identifiés :**
- **Ligne 31** : `fetch('/api/biens/${bien.id}/locataire')` - GET
  - ❌ Route n'existe pas
  - Solution : Créer `getLocataire(bienId)` dans `database.ts`
  
- **Ligne 63** : `fetch('/api/biens/${bien.id}/locataire', { method: 'POST' })` - POST
  - ❌ Route n'existe pas
  - Solution : Créer `upsertLocataire(bienId, locataireData)` dans `database.ts`
  
- **Ligne 72** : `window.location.reload()` - ⚠️ Problème de rechargement

**Impact :** Le composant Locataire ne peut pas charger ni sauvegarder les informations du locataire.

---

### 3. `components/biens/Financement.tsx`

**Problèmes identifiés :**
- **Ligne 56** : `fetch('/api/biens/${bien.id}', { method: 'PUT' })` - PUT
  - ❌ Route n'existe pas
  - Solution : Utiliser `updateBien(bienId, updates)` de `database.ts` ✅ (fonction existe)
  
- **Ligne 69** : `window.location.reload()` - ⚠️ Problème de rechargement

**Impact :** Les modifications du financement ne sont pas sauvegardées.

---

### 4. `components/biens/Charges.tsx`

**Problèmes identifiés :**
- **Ligne 26** : `fetch('/api/biens/${bien.id}', { method: 'PUT' })` - PUT
  - ❌ Route n'existe pas
  - Solution : Utiliser `updateBien(bienId, updates)` de `database.ts` ✅ (fonction existe)
  
- **Ligne 40** : `window.location.reload()` - ⚠️ Problème de rechargement

**Impact :** Les modifications des charges ne sont pas sauvegardées.

---

### 5. `components/biens/Investissement.tsx`

**Problèmes identifiés :**
- **Ligne 64** : `fetch('/api/biens/${bien.id}', { method: 'PUT' })` - PUT
  - ❌ Route n'existe pas
  - Solution : Utiliser `updateBien(bienId, updates)` de `database.ts` ✅ (fonction existe)
  
- **Ligne 77** : `window.location.reload()` - ⚠️ Problème de rechargement

**Impact :** Les modifications de l'investissement ne sont pas sauvegardées.

---

### 6. `components/biens/Historique.tsx`

**Problèmes identifiés :**
- **Ligne 22** : `fetch('/api/biens/${bien.id}', { method: 'PUT' })` - PUT
  - ❌ Route n'existe pas
  - Solution : Utiliser `updateBien(bienId, updates)` de `database.ts` ✅ (fonction existe)
  
- **Ligne 33** : `window.location.reload()` - ⚠️ Problème de rechargement

**Impact :** Les modifications de l'historique ne sont pas sauvegardées.

---

## ⚠️ PROBLÈMES SUPPLÉMENTAIRES

### 🔄 Chargements infinis avec `window.location.reload()`

**Fichiers concernés :**
1. `components/biens/EnrichissementForms.tsx` ligne 986
2. `components/dashboard/DashboardClient.tsx` ligne 49
3. `components/biens/Financement.tsx` ligne 69
4. `components/biens/Locataire.tsx` ligne 72
5. `components/biens/Investissement.tsx` ligne 77
6. `components/biens/Historique.tsx` ligne 33
7. `components/biens/Charges.tsx` ligne 40

**Problème :** `window.location.reload()` peut causer des chargements infinis ou des boucles de rechargement.

**Solution recommandée :**
- Remplacer par `router.refresh()` pour Next.js
- Ou fermer le dialog et recharger les données via `fetchBien()` / `fetchData()`
- Ou utiliser un système d'événements pour notifier les composants parents

---

## 📋 FONCTIONS DISPONIBLES DANS `database.ts`

### ✅ Fonctions existantes pour les biens :
- `getBiens(userId, supabaseClient?)` - ✅ Existe
- `getBien(bienId)` - ✅ Existe
- `createBien(userId, bien)` - ✅ Existe
- `updateBien(bienId, updates)` - ✅ Existe
- `deleteBien(bienId)` - ✅ Existe

### ✅ Fonctions existantes pour les profils :
- `getUserProfile(userId)` - ✅ Existe
- `createUserProfile(userId, email, name?)` - ✅ Existe
- `updateUserProfile(userId, updates)` - ✅ Existe

### ❌ Fonctions MANQUANTES nécessaires :
- `getLocataire(bienId)` - ❌ N'existe pas
- `upsertLocataire(bienId, locataireData)` - ❌ N'existe pas
- `getLoyers(bienId, annee)` - ❌ N'existe pas
- `upsertLoyer(bienId, annee, mois, paiement)` - ❌ N'existe pas

---

## 🎯 PLAN DE CORRECTION COMPLET

### ÉTAPE 1 : Créer les fonctions manquantes dans `database.ts`

#### 1.1 Fonctions Locataire
```typescript
// Récupérer le locataire d'un bien
export async function getLocataire(bienId: string): Promise<Locataire | null>

// Créer ou mettre à jour le locataire
export async function upsertLocataire(bienId: string, locataireData: Partial<Locataire>): Promise<Locataire>
```

#### 1.2 Fonctions Loyers
```typescript
// Récupérer les loyers d'un bien pour une année
export async function getLoyers(bienId: string, annee: number): Promise<Loyer[]>

// Créer ou mettre à jour un paiement de loyer
export async function upsertLoyer(
  bienId: string, 
  annee: number, 
  mois: number, 
  paiement: { payeLocataire: boolean; payeAPL: boolean }
): Promise<Loyer>
```

### ÉTAPE 2 : Remplacer tous les `fetch()` par les fonctions `database.ts`

#### 2.1 `components/biens/Loyers.tsx`
- Remplacer `fetch('/api/biens/${bien.id}/locataire')` par `getLocataire(bien.id)`
- Remplacer `fetch('/api/biens/${bien.id}/loyers?annee=...')` par `getLoyers(bien.id, annee)`
- Remplacer `fetch('/api/biens/${bien.id}/loyers', { method: 'POST' })` par `upsertLoyer(...)`

#### 2.2 `components/biens/Locataire.tsx`
- Remplacer `fetch('/api/biens/${bien.id}/locataire')` par `getLocataire(bien.id)`
- Remplacer `fetch('/api/biens/${bien.id}/locataire', { method: 'POST' })` par `upsertLocataire(bien.id, formData)`

#### 2.3 `components/biens/Financement.tsx`
- Remplacer `fetch('/api/biens/${bien.id}', { method: 'PUT' })` par `updateBien(bien.id, updates)`

#### 2.4 `components/biens/Charges.tsx`
- Remplacer `fetch('/api/biens/${bien.id}', { method: 'PUT' })` par `updateBien(bien.id, updates)`

#### 2.5 `components/biens/Investissement.tsx`
- Remplacer `fetch('/api/biens/${bien.id}', { method: 'PUT' })` par `updateBien(bien.id, updates)`

#### 2.6 `components/biens/Historique.tsx`
- Remplacer `fetch('/api/biens/${bien.id}', { method: 'PUT' })` par `updateBien(bien.id, updates)`

### ÉTAPE 3 : Corriger tous les `window.location.reload()`

#### 3.1 Pattern de remplacement recommandé

**Avant :**
```typescript
if (response.ok) {
  setEditing(false)
  window.location.reload()
}
```

**Après (Option 1 - Refresh Next.js) :**
```typescript
import { useRouter } from 'next/navigation'
const router = useRouter()

if (response.ok) {
  setEditing(false)
  router.refresh() // Recharge les données sans recharger toute la page
}
```

**Après (Option 2 - Callback parent) :**
```typescript
// Si le composant reçoit un callback onSuccess
if (response.ok) {
  setEditing(false)
  onSuccess?.() // Le parent recharge les données
}
```

**Après (Option 3 - Événement personnalisé) :**
```typescript
if (response.ok) {
  setEditing(false)
  window.dispatchEvent(new CustomEvent('refresh-bien'))
  // Le composant parent écoute cet événement
}
```

#### 3.2 Fichiers à corriger :
- `components/biens/EnrichissementForms.tsx` ligne 986
- `components/dashboard/DashboardClient.tsx` ligne 49
- `components/biens/Financement.tsx` ligne 69
- `components/biens/Locataire.tsx` ligne 72
- `components/biens/Investissement.tsx` ligne 77
- `components/biens/Historique.tsx` ligne 33
- `components/biens/Charges.tsx` ligne 40

---

## 📊 TABLEAU RÉCAPITULATIF

| Fichier | Appels API | window.location.reload | Fonction database.ts à utiliser |
|---------|------------|------------------------|--------------------------------|
| `Loyers.tsx` | 3 ❌ | 0 | `getLocataire()`, `getLoyers()`, `upsertLoyer()` |
| `Locataire.tsx` | 2 ❌ | 1 ⚠️ | `getLocataire()`, `upsertLocataire()` |
| `Financement.tsx` | 1 ❌ | 1 ⚠️ | `updateBien()` ✅ |
| `Charges.tsx` | 1 ❌ | 1 ⚠️ | `updateBien()` ✅ |
| `Investissement.tsx` | 1 ❌ | 1 ⚠️ | `updateBien()` ✅ |
| `Historique.tsx` | 1 ❌ | 1 ⚠️ | `updateBien()` ✅ |
| `EnrichissementForms.tsx` | 0 ✅ | 1 ⚠️ | - |
| `DashboardClient.tsx` | 0 ✅ | 1 ⚠️ | - |

---

## ✅ PRIORITÉS DE CORRECTION

### 🔴 PRIORITÉ HAUTE (Bloquant)
1. Créer `getLocataire()` et `upsertLocataire()` dans `database.ts`
2. Créer `getLoyers()` et `upsertLoyer()` dans `database.ts`
3. Corriger `Loyers.tsx` (3 appels API)
4. Corriger `Locataire.tsx` (2 appels API)

### 🟡 PRIORITÉ MOYENNE (Fonctionnalités cassées)
5. Corriger `Financement.tsx` (1 appel API + reload)
6. Corriger `Charges.tsx` (1 appel API + reload)
7. Corriger `Investissement.tsx` (1 appel API + reload)
8. Corriger `Historique.tsx` (1 appel API + reload)

### 🟢 PRIORITÉ BASSE (Amélioration UX)
9. Corriger tous les `window.location.reload()` restants
10. Optimiser les rechargements de données

---

## 📝 NOTES IMPORTANTES

1. **Aucune route API n'existe** : Le dossier `app/api/` est vide ou n'existe pas
2. **Toutes les données doivent passer par Supabase** : Utiliser directement les fonctions de `database.ts`
3. **Les modèles Locataire et Loyer existent** : D'après le résumé, les modèles Prisma existent, donc les tables Supabase aussi
4. **Cohérence avec EnrichissementForms** : Ce fichier a déjà été corrigé et utilise `updateBien()` ✅

---

## 🚀 ESTIMATION

- **Temps estimé** : 2-3 heures
- **Fichiers à modifier** : 8 fichiers
- **Fonctions à créer** : 4 fonctions dans `database.ts`
- **Complexité** : Moyenne (nécessite connaissance des modèles Supabase)
