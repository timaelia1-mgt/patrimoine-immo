# 📚 Documentation JSDoc - Patrimoine Immo

Ce fichier liste toutes les fonctions documentées avec JSDoc dans le projet.

Les JSDoc permettent :
- ✅ Autocomplétion intelligente dans l'IDE
- ✅ Documentation inline au survol
- ✅ Validation des types par TypeScript
- ✅ Génération de documentation automatique

---

## 📁 lib/database.ts

Module de gestion des données Supabase (CRUD).

### Biens immobiliers

| Fonction | Description |
|----------|-------------|
| `getBiens(userId, supabaseClient?)` | Récupère tous les biens d'un utilisateur |
| `getBien(bienId, supabaseClient?)` | Récupère un bien par son ID |
| `createBien(userId, bien)` | Crée un nouveau bien (vérifie limite du plan) |
| `updateBien(bienId, updates)` | Met à jour un bien existant |
| `deleteBien(bienId)` | Supprime un bien et ses données associées |

### Profil utilisateur

| Fonction | Description |
|----------|-------------|
| `getUserProfile(userId, supabaseClient?)` | Récupère le profil utilisateur |
| `createUserProfile(userId, email, name?)` | Crée un nouveau profil |
| `updateUserProfile(userId, updates)` | Met à jour le profil |

### Locataires

| Fonction | Description |
|----------|-------------|
| `getLocataire(bienId, supabaseClient?)` | Récupère le locataire d'un bien |
| `upsertLocataire(bienId, locataireData, supabaseClient?)` | Crée ou met à jour un locataire |

### Loyers

| Fonction | Description |
|----------|-------------|
| `getLoyers(bienId, annee, supabaseClient?)` | Récupère les loyers d'une année |
| `upsertLoyer(bienId, annee, mois, paiement, supabaseClient?)` | Crée ou met à jour un loyer |

### Quittances

| Fonction | Description |
|----------|-------------|
| `createQuittance(data)` | Crée une nouvelle quittance |
| `getQuittancesByBien(bienId)` | Récupère les quittances d'un bien |
| `getQuittancesByUser(userId)` | Récupère toutes les quittances d'un utilisateur |
| `getQuittance(bienId, mois, annee)` | Récupère une quittance spécifique |
| `updateQuittanceEmailStatus(quittanceId, emailEnvoye, dateEnvoiEmail?)` | Met à jour le statut d'envoi |

### Investissements secondaires

| Fonction | Description |
|----------|-------------|
| `getInvestissementsSecondaires(bienId)` | Récupère les investissements secondaires |
| `createInvestissementSecondaire(bienId, data)` | Crée un investissement secondaire |
| `deleteInvestissementSecondaire(id)` | Supprime un investissement secondaire |

---

## 📁 lib/calculations.ts

Module de calculs financiers immobiliers.

### Cash-flow et rentabilité

| Fonction | Description |
|----------|-------------|
| `calculerCashFlow(bien)` | Calcule le cash-flow net mensuel |
| `calculerLoyerNet(bien)` | Calcule le loyer après charges (avant crédit) |
| `calculerTauxAutofinancement(bien)` | Calcule le % de couverture du crédit par le loyer |
| `creditEstTermine(bien)` | Vérifie si le crédit est remboursé |
| `calculerStatutBien(bien)` | Détermine le statut financier du bien |

### Charges et crédit

| Fonction | Description |
|----------|-------------|
| `calculateChargesMensuelles(bien)` | Somme des charges mensuelles |
| `calculateMensualiteCredit(montant, tauxAnnuel, dureeMois)` | Calcule la mensualité d'un crédit |

### TRI (Taux de Rendement Interne)

| Fonction | Description |
|----------|-------------|
| `calculateTRI(investissementInitial, fluxAnnuels)` | Calcule le TRI avec Newton-Raphson |
| `calculateTRIBien(bien, loyerMensuel, chargesMensuelles, mensualiteCredit, moisPossession)` | Calcule le TRI d'un bien spécifique |

### Utilitaires

| Fonction | Description |
|----------|-------------|
| `formatCurrency(amount)` | Formate un montant en euros (1 234,56 €) |
| `toNumber(value)` | Convertit une valeur en nombre (interne) |

---

## 📁 lib/validations.ts

Module de validation des données.

### Validation des dates

| Fonction | Description |
|----------|-------------|
| `validateDatesCoherence(dates)` | Valide la cohérence chronologique des dates |
| `showValidationErrors(errors)` | Affiche les erreurs via toast |
| `validateAndShowErrors(dates)` | Valide et affiche les erreurs automatiquement |

### Interfaces

| Interface | Description |
|-----------|-------------|
| `DatesValidation` | Structure des dates à valider |
| `ValidationResult` | Résultat de validation (isValid, errors) |

---

## 📁 lib/generateQuittance.ts

Module de génération de PDF.

| Fonction | Description |
|----------|-------------|
| `generateQuittancePDF(data)` | Génère un PDF de quittance de loyer |

---

## 📁 lib/generateRapportAnnuel.ts

Module de génération de rapports annuels.

| Fonction | Description |
|----------|-------------|
| `generateRapportAnnuelPDF(data)` | Génère un rapport annuel PDF |

---

## 📁 lib/stripe.ts

Module de gestion des paiements Stripe.

| Constante/Fonction | Description |
|--------------------|-------------|
| `PLANS` | Configuration des plans d'abonnement |
| `getStripe()` | Retourne l'instance Stripe client |

---

## 📁 lib/logger.ts

Module de logging.

| Fonction | Description |
|----------|-------------|
| `logger.info(message, data?)` | Log d'information |
| `logger.warn(message, data?)` | Log d'avertissement |
| `logger.error(message, error?)` | Log d'erreur |

---

## 📁 lib/rate-limit.ts

Module de rate limiting.

| Fonction | Description |
|----------|-------------|
| `rateLimit(key, options)` | Vérifie et applique le rate limit |

---

## 🛠️ Utilisation dans VS Code

### Autocomplétion

Tapez le nom d'une fonction et VS Code affichera la documentation :

```typescript
import { calculateCashFlow } from '@/lib/calculations'

// Survolez la fonction pour voir la doc
const cashFlow = calculateCashFlow(bien)
//                ^^^^^^^^^^^^^^^^
//                Documentation JSDoc visible ici
```

### Paramètres

VS Code affiche les descriptions des paramètres :

```typescript
createBien(
  userId,  // "L'ID du propriétaire du bien"
  {
    nom: 'Appartement',  // Autocomplétion des champs
    prixAchat: 250000
  }
)
```

### Types

Les types sont automatiquement inférés grâce aux JSDoc :

```typescript
const bien = await getBien('uuid-123')
//    ^^^^
//    Type: Bien | null

if (bien) {
  bien.loyerMensuel  // Autocomplétion + type number
}
```

---

## 📊 Couverture JSDoc

| Fichier | Fonctions | Documentées | Couverture |
|---------|-----------|-------------|------------|
| `lib/database.ts` | 20 | 18 | 90% |
| `lib/calculations.ts` | 12 | 12 | 100% |
| `lib/validations.ts` | 3 | 3 | 100% |
| `lib/generateQuittance.ts` | 1 | 1 | 100% |

---

## 📚 Ressources

- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [JSDoc Official](https://jsdoc.app/)
- [VS Code IntelliSense](https://code.visualstudio.com/docs/editor/intellisense)

---

**Dernière mise à jour** : Février 2026
