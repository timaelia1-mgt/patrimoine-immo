# RAPPORT COMPLET - SAAS PATRIMO

## 📋 VUE D'ENSEMBLE

### Informations générales
- **Nom** : Patrimo
- **Description** : SaaS de gestion immobilière pour propriétaires et investisseurs
- **Version** : 0.1.0
- **Type** : Application web Next.js avec authentification Supabase
- **URL Production** : Non spécifiée (à configurer)

### Technologies utilisées
- **Framework** : Next.js 16.1.3 (App Router)
- **React** : 19.2.3
- **TypeScript** : 5.x
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth (OTP par email)
- **Paiements** : Stripe (abonnements)
- **Email** : Resend
- **PDF** : jsPDF 4.1.0
- **Graphiques** : Recharts 3.7.0
- **UI** : Radix UI + Tailwind CSS 4
- **Validation** : Zod 4.3.5
- **Formulaires** : React Hook Form 7.71.1

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Base de données (Supabase/PostgreSQL)

#### Table `users` (Supabase Auth)
Gérée automatiquement par Supabase Auth :
- `id` (uuid, PK)
- `email` (text, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Table `profiles`
Profil utilisateur étendu :
- `id` (uuid, PK, FK → users.id)
- `user_id` (uuid, FK → users.id)
- `email` (text)
- `name` (text, nullable)
- `plan_type` (text) : 'decouverte' | 'essentiel' | 'premium'
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `currency` (text, nullable)
- `rent_payment_day` (integer, nullable)
- `payment_delay_days` (integer, nullable)
- `email_alerts_enabled` (boolean, nullable)
- `app_notifications_enabled` (boolean, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Table `biens`
Biens immobiliers :
- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id, indexé)
- `nom` (text)
- `adresse` (text)
- `ville` (text)
- `code_postal` (text)
- `type_financement` (enum) : 'CREDIT' | 'CASH'
- `montant_credit` (numeric, nullable)
- `taux_credit` (numeric, nullable)
- `duree_credit` (integer, nullable)
- `mensualite_credit` (numeric, nullable)
- `date_debut_credit` (timestamp, nullable)
- `capital_restant_du` (numeric, nullable)
- `loyer_mensuel` (numeric)
- `charges_mensuelles` (numeric)
- `taxe_fonciere` (numeric, default 0)
- `charges_copro` (numeric, default 0)
- `assurance` (numeric, default 0)
- `frais_gestion` (numeric, default 0)
- `autres_charges` (numeric, default 0)
- `prix_achat` (numeric, nullable)
- `frais_notaire` (numeric, nullable)
- `travaux_initiaux` (numeric, nullable)
- `autres_frais` (numeric, nullable)
- `date_acquisition` (timestamp, nullable)
- `date_mise_en_location` (timestamp, nullable)
- `revenus_anterieurs_override` (numeric, nullable)
- `charges_anterieures_override` (numeric, nullable)
- `enrichissement_financement` (boolean, default false)
- `enrichissement_investissement` (boolean, default false)
- `enrichissement_historique` (boolean, default false)
- `enrichissement_rentabilite` (boolean, default false)
- `enrichissement_charges` (boolean, default false)
- `enrichissement_locataire` (boolean, default false)
- `enrichissement_depenses` (boolean, default false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Table `locataires`
Locataires des biens :
- `id` (uuid, PK)
- `bien_id` (uuid, FK → biens.id, unique)
- `nom` (text)
- `prenom` (text)
- `email` (text, nullable)
- `telephone` (text, nullable)
- `date_entree` (timestamp, nullable)
- `montant_apl` (numeric(10,2), default 0)
- `mode_paiement` (text, default 'virement') : 'virement' | 'cheque' | 'especes' | 'prelevement'
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Table `loyers`
Loyers mensuels par bien :
- `id` (uuid, PK)
- `bien_id` (uuid, FK → biens.id)
- `annee` (integer)
- `mois` (integer) : 0-11 (Janvier = 0, Décembre = 11)
- `montant_locataire` (numeric(10,2))
- `montant_apl` (numeric(10,2))
- `paye_locataire` (boolean, default false)
- `paye_apl` (boolean, default false)
- `date_paiement_locataire` (timestamp, nullable)
- `date_paiement_apl` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- **Contrainte unique** : `(bien_id, annee, mois)`

### Structure des dossiers

```
patrimoine-immo/
├── app/
│   ├── (app)/                    # Routes protégées (nécessitent auth)
│   │   ├── abonnement/
│   │   │   └── page.tsx         # Page choix abonnement Stripe
│   │   ├── biens/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Page détail bien
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard principal
│   │   ├── parametres/
│   │   │   └── page.tsx         # Paramètres utilisateur
│   │   └── layout.tsx           # Layout avec Sidebar
│   ├── (auth)/                   # Routes publiques auth
│   │   ├── forgot-password/     # Mot de passe oublié
│   │   ├── login/
│   │   │   └── page.tsx         # Connexion
│   │   ├── reset-password/      # Réinitialisation
│   │   ├── signup/
│   │   │   └── page.tsx         # Inscription
│   │   ├── verify-otp/
│   │   │   └── page.tsx         # Vérification OTP
│   │   └── layout.tsx            # Layout auth
│   ├── (marketing)/              # Landing page
│   │   └── page.tsx
│   ├── api/                      # API Routes Next.js
│   │   ├── create-checkout/
│   │   │   └── route.ts         # Création session Stripe
│   │   ├── send-quittance/
│   │   │   └── route.ts         # Envoi email quittance
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts     # Webhooks Stripe
│   ├── auth/
│   │   └── callback/             # Callback Supabase Auth
│   ├── globals.css               # Styles globaux
│   └── layout.tsx                # Layout racine
├── components/
│   ├── abonnement/
│   │   └── UpgradeButton.tsx    # Bouton upgrade plan
│   ├── biens/
│   │   ├── BienDetailClient.tsx # Client wrapper détail bien
│   │   ├── BienFormDialog.tsx   # Modal création/édition bien
│   │   ├── Charges.tsx          # Onglet Charges
│   │   ├── Documents.tsx        # Onglet Documents
│   │   ├── EnrichissementForms.tsx # Formulaires enrichissement
│   │   ├── Financement.tsx       # Onglet Financement
│   │   ├── Historique.tsx        # Onglet Historique
│   │   ├── Investissement.tsx   # Onglet Investissement
│   │   ├── Locataire.tsx        # Onglet Locataire
│   │   ├── Loyers.tsx           # Onglet Loyers
│   │   ├── QuittanceModal.tsx   # Modal génération quittance
│   │   ├── Rentabilite.tsx      # Onglet Rentabilité
│   │   └── VueEnsemble.tsx      # Onglet Vue d'ensemble
│   ├── dashboard/
│   │   ├── DashboardClient.tsx  # Client wrapper dashboard
│   │   └── PatrimoineChart.tsx  # Graphique évolution patrimoine
│   ├── layout/
│   │   └── Sidebar.tsx          # Sidebar navigation
│   ├── modals/
│   │   └── UpgradeModal.tsx     # Modal upgrade plan
│   ├── parametres/
│   │   └── ParametresClient.tsx # Client wrapper paramètres
│   └── ui/                       # Composants UI (shadcn/ui)
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client Supabase (browser)
│   │   ├── server.ts            # Client Supabase (server)
│   │   └── middleware.ts        # Middleware auth
│   ├── auth-context.tsx         # Context React auth
│   ├── auth-guard.tsx           # Guard protection routes
│   ├── calculations.ts          # Fonctions calculs financiers
│   ├── database.ts              # Fonctions CRUD Supabase
│   ├── generateQuittance.ts    # Génération PDF quittances
│   ├── stripe.ts                # Configuration Stripe + plans
│   ├── subscription-plans.ts    # Plans alternatifs (non utilisé)
│   ├── theme-provider.tsx       # Provider thème dark/light
│   ├── theme.ts                 # Configuration thème
│   └── utils.ts                 # Utilitaires (cn, etc.)
├── prisma/
│   └── schema.prisma            # Schéma Prisma (référence)
├── public/                      # Assets statiques
├── scripts/                     # Scripts SQL migration
├── middleware.ts                # Middleware Next.js (auth)
├── next.config.ts               # Config Next.js
├── tailwind.config.ts           # Config Tailwind
├── tsconfig.json                # Config TypeScript
└── package.json                 # Dépendances
```

---

## 🎯 FONCTIONNALITÉS PAR MODULE

### Module Authentification

#### Inscription
- **Route** : `/signup`
- **Méthode** : OTP par email (Supabase Auth)
- **Processus** :
  1. Saisie email
  2. Envoi code OTP
  3. Vérification code (`/verify-otp`)
  4. Création profil automatique (plan 'decouverte')
- **Composant** : `app/(auth)/signup/page.tsx`

#### Connexion
- **Route** : `/login`
- **Méthode** : OTP par email
- **Processus** :
  1. Saisie email
  2. Envoi code OTP
  3. Vérification code
  4. Redirection dashboard
- **Composant** : `app/(auth)/login/page.tsx`

#### Gestion session
- **Context** : `lib/auth-context.tsx`
- **Protection routes** : `lib/auth-guard.tsx`
- **Middleware** : `middleware.ts` (vérification session)
- **Déconnexion** : `components/layout/Sidebar.tsx`

#### Mot de passe oublié
- **Route** : `/forgot-password`
- **Status** : Implémenté mais peut avoir des timeouts

### Module Dashboard

#### Vue d'ensemble
- **Route** : `/dashboard`
- **Composant** : `components/dashboard/DashboardClient.tsx`
- **Fonctionnalités** :
  - Cartes récapitulatives (KPI)
  - Graphique "Évolution du Patrimoine Net"
  - Liste des biens avec statuts
  - Bouton création bien (limité par plan)

#### Graphique Patrimoine Net
- **Composant** : `components/dashboard/PatrimoineChart.tsx`
- **Bibliothèque** : Recharts (AreaChart)
- **Calcul** : 
  - Utilise **amortissement dégressif** (corrigé V1.5)
  - Projection 20 ans
  - Points de données tous les 3 mois
  - Affichage patrimoine actuel + projection
- **Formule** :
  ```typescript
  capitalRestant = montant * Math.pow(1 + taux, moisEcoules) -
                   mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)
  capitalRembourse = montantTotal - capitalRestant
  ```

### Module Biens

#### Vue d'ensemble
- **Composant** : `components/biens/VueEnsemble.tsx`
- **Fonctionnalités** :
  - Résumé bien (adresse, type financement)
  - Statut autofinancement (badge coloré)
  - Cash-flow mensuel
  - Taux autofinancement
  - Actions rapides

#### Loyers
- **Composant** : `components/biens/Loyers.tsx`
- **Fonctionnalités** :
  - Grille 12 mois (année en cours)
  - Toggle paiement locataire/APL
  - Calcul CA réalisé vs prévu
  - Bouton génération quittance (si payé)
  - Sauvegarde automatique paiements
- **Données** : Table `loyers` (un enregistrement par mois/bien)

#### Charges
- **Composant** : `components/biens/Charges.tsx`
- **Fonctionnalités** :
  - Édition charges mensuelles :
    - Taxe foncière
    - Charges copropriété
    - Assurance
    - Frais de gestion
    - Autres charges
  - Sauvegarde en temps réel

#### Financement
- **Composant** : `components/biens/Financement.tsx`
- **Fonctionnalités** :
  - Édition informations crédit :
    - Date début crédit
    - Mensualité
    - Montant emprunté
    - Taux d'intérêt
    - Durée (mois)
  - **Progression remboursement** :
    - Barre progression temporelle (bleue)
    - Barre progression capital remboursé (verte)
    - Calcul avec **amortissement dégressif**
    - Capital remboursé / restant dû
    - Mois écoulés / restants
- **Formule amortissement** :
  ```typescript
  capitalRestant = montantCredit * Math.pow(1 + taux, moisEcoules) -
                   mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)
  progression = (capitalRembourse / montantCredit) * 100
  ```

#### Locataires
- **Composant** : `components/biens/Locataire.tsx`
- **Fonctionnalités** :
  - Édition informations locataire :
    - Nom, prénom
    - Email, téléphone
    - Date d'entrée
    - Montant APL
    - Mode de paiement
  - Sauvegarde automatique

#### Investissement
- **Composant** : `components/biens/Investissement.tsx`
- **Fonctionnalités** :
  - Édition coûts acquisition :
    - Prix d'achat
    - Frais de notaire
    - Travaux initiaux
    - Autres frais
  - Calcul montant total investi
  - Utilisé pour calcul patrimoine

#### Rentabilité
- **Composant** : `components/biens/Rentabilite.tsx`
- **Fonctionnalités** :
  - Calcul rendement brut/net
  - Taux de rentabilité
  - Cash-flow annuel
  - ROI (Return on Investment)

#### Historique
- **Composant** : `components/biens/Historique.tsx`
- **Fonctionnalités** :
  - Édition revenus/charges années précédentes
  - Override pour années antérieures
  - Calcul historique rentabilité

#### Documents
- **Composant** : `components/biens/Documents.tsx`
- **Fonctionnalités** :
  - Upload documents (à implémenter)
  - Liste documents associés

### Module Quittances

#### Génération PDF
- **Composant** : `components/biens/QuittanceModal.tsx`
- **Bibliothèque** : jsPDF 4.1.0
- **Template** : `lib/generateQuittance.ts`
- **Fonctionnalités** :
  - Génération PDF professionnel
  - Dates de paiement modifiables :
    - Date paiement locataire
    - Date paiement APL
  - Informations complètes :
    - Propriétaire
    - Bien (adresse complète)
    - Locataire
    - Période (calculée automatiquement)
    - Montants (loyer + APL)
    - Mode de paiement
  - Téléchargement PDF
  - Envoi email automatique

#### Envoi Email
- **Route API** : `POST /api/send-quittance`
- **Service** : Resend
- **Fonctionnalités** :
  - Email HTML professionnel
  - Pièce jointe PDF (base64)
  - Sujet personnalisé
  - Template avec branding Patrimo

### Module Stripe (Abonnements)

#### Plans disponibles
- **Découverte** (gratuit) :
  - Prix : 0€/mois
  - Limite : 2 biens maximum
  - Fonctionnalités : Base + graphique patrimoine
- **Essentiel** :
  - Prix : 9€/mois
  - Limite : 5 biens maximum
  - Fonctionnalités : Toutes + quittances PDF + email
- **Premium** :
  - Prix : 19€/mois
  - Limite : Illimité
  - Fonctionnalités : Toutes + exports avancés + support 24/7

#### Checkout Stripe
- **Route API** : `POST /api/create-checkout`
- **Composant** : `components/abonnement/UpgradeButton.tsx`
- **Processus** :
  1. Clic "Passer au plan supérieur"
  2. Création session Stripe Checkout
  3. Redirection Stripe
  4. Paiement
  5. Webhook met à jour profil

#### Webhooks Stripe
- **Route API** : `POST /api/webhooks/stripe`
- **Événements gérés** :
  - `checkout.session.completed` : Mise à jour plan après paiement
  - `customer.subscription.updated` : Changement plan
  - `customer.subscription.deleted` : Rétrogradation plan Découverte
- **Sécurité** : Vérification signature webhook

#### Limitation création biens
- **Côté client** : `components/layout/Sidebar.tsx`
  - Bouton "Ajouter un bien" désactivé si limite atteinte
  - Tooltip informatif au hover
  - Modal upgrade si clic
- **Côté serveur** : `lib/database.ts` (fonction `createBien`)
  - Vérification limite avant création
  - Erreur si limite dépassée
- **Composant** : `components/modals/UpgradeModal.tsx`
  - Affichage limite atteinte
  - CTA vers page abonnement

---

## 🧮 CALCULS IMPORTANTS

### Progression crédit (amortissement dégressif)

**Fichier** : `components/biens/Financement.tsx`

**Formule** :
```typescript
const taux = tauxCredit / 100 / 12 // Taux mensuel
const capitalRestant = montantCredit * Math.pow(1 + taux, moisEcoules) -
                       mensualite * ((Math.pow(1 + taux, moisEcoules) - 1) / taux)
const capitalRembourse = montantCredit - Math.max(0, capitalRestant)
const progression = (capitalRembourse / montantCredit) * 100
```

**Utilisation** :
- Onglet Financement (affichage progression)
- Graphique patrimoine (calcul patrimoine net)

### Cash-flow mensuel

**Fichier** : `lib/calculations.ts`

**Formule** :
```typescript
cashFlow = loyerMensuel - chargesMensuelles - mensualiteCredit
```

**Charges mensuelles** :
- Taxe foncière
- Charges copropriété
- Assurance
- Frais de gestion
- Autres charges

### Loyer net

**Formule** :
```typescript
loyerNet = loyerMensuel - chargesMensuelles
```

### Taux d'autofinancement

**Formule** :
```typescript
tauxAutofinancement = (loyerNet / mensualiteCredit) * 100
```

**Statuts** :
- `AUTOFINANCE` : ≥ 100% (vert)
- `PARTIEL` : 70-99% (jaune)
- `NON_AUTOFINANCE` : < 70% (rouge)
- `FINANCE` : Cash ou crédit terminé (vert)

### Patrimoine net

**Fichier** : `components/dashboard/PatrimoineChart.tsx`

**Calcul** :
```typescript
// Pour chaque bien
if (typeFinancement === 'CASH') {
  patrimoine += montantInvestissement
} else if (typeFinancement === 'CREDIT') {
  // Calcul capital remboursé avec amortissement dégressif
  patrimoine += capitalRembourse
}
```

**Projection** : Calcul mois par mois sur 20 ans

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DIRECT_URL=postgresql://xxx (pour Prisma)
DATABASE_URL=postgresql://xxx (pour Prisma)
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_xxx
```

### Resend (Email)
```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@patrimo.fr
```

### Application
```
NEXT_PUBLIC_APP_URL=https://patrimo.fr (ou http://localhost:3000 en dev)
```

---

## 🐛 BUGS CONNUS ET TODO

### Bugs connus
- [ ] **Timeout changement mot de passe** : La fonctionnalité existe mais peut avoir des problèmes de timeout
- [ ] **Mémoriser onglet actif** : Après sauvegarde dans onglet Charges, l'onglet actif n'est pas mémorisé
- [ ] **Problèmes navigation** : À auditer (navigation entre pages peut être améliorée)
- [ ] **Price ID undefined** : Parfois erreur "Price ID et User ID requis" dans UpgradeButton (logs ajoutés pour debug)

### Améliorations prévues
- [ ] **Système multi-lots** : Gérer plusieurs lots par bien
- [ ] **Restreindre quittances** : Limiter génération quittances aux plans payants (Essentiel/Premium)
- [ ] **Annulation abonnement** : Page dédiée pour gérer l'abonnement (actuellement via Stripe Dashboard)
- [ ] **Exports CSV/PDF** : Exports avancés pour plan Premium
- [ ] **Notifications** : Système de notifications pour retards de paiement
- [ ] **Multi-devises** : Support autres devises (champ existe dans profiles mais non utilisé)

---

## 📅 HISTORIQUE DES FONCTIONNALITÉS

### V1.0 - MVP Initial
- Dashboard avec cartes récapitulatives
- Gestion biens (CRUD)
- Gestion locataires
- Gestion charges mensuelles
- Suivi loyers (grille 12 mois)
- Authentification OTP

### V1.1 - Graphique patrimoine
- Graphique "Évolution du Patrimoine Net"
- Projection 20 ans
- Calcul patrimoine avec investissement

### V1.2 - Quittances PDF + Email
- Génération PDF quittances (jsPDF)
- Template professionnel
- Envoi email automatique (Resend)
- Modal génération quittance

### V1.3 - Stripe Checkout + Webhooks
- Intégration Stripe
- 3 plans (Découverte, Essentiel, Premium)
- Checkout Stripe
- Webhooks gestion abonnements
- Mise à jour plan automatique

### V1.4 - Limitation biens par plan
- Vérification limite côté client (Sidebar)
- Vérification limite côté serveur (createBien)
- Modal upgrade si limite atteinte
- Badge "Limite atteinte" sur bouton

### V1.5 - Calcul amortissement dégressif
- Correction calcul progression crédit (Financement.tsx)
- Correction calcul patrimoine (PatrimoineChart.tsx)
- Formule standard crédit immobilier
- Deux barres progression (temporelle + capital)

### V1.6 - Dates paiement quittances
- Champs dates modifiables (paiement locataire + APL)
- Pré-remplissage automatique
- Affichage dates dans PDF
- Remplacement "Début/Fin période" par dates paiement

---

## 🧩 COMPOSANTS CLÉS

### Composants Dashboard

#### `DashboardClient.tsx`
- **Rôle** : Wrapper client pour dashboard
- **Fonctionnalités** :
  - Gestion modal création bien
  - Vérification limite plan
  - Affichage modal upgrade si nécessaire
  - Refresh données après création

#### `PatrimoineChart.tsx`
- **Rôle** : Graphique évolution patrimoine
- **Fonctionnalités** :
  - Calcul patrimoine avec amortissement dégressif
  - Projection 20 ans
  - Affichage patrimoine actuel + projection
  - Avertissement si données investissement manquantes

### Composants Biens

#### `BienDetailClient.tsx`
- **Rôle** : Wrapper client page détail bien
- **Fonctionnalités** :
  - Gestion onglets (Tabs)
  - Navigation entre sections
  - Refresh données

#### `BienFormDialog.tsx`
- **Rôle** : Modal création/édition bien
- **Fonctionnalités** :
  - Formulaire création bien
  - Validation données
  - Gestion erreur limite plan
  - Callback succès

#### `Loyers.tsx`
- **Rôle** : Gestion loyers mensuels
- **Fonctionnalités** :
  - Grille 12 mois
  - Toggle paiement locataire/APL
  - Calcul CA réalisé vs prévu
  - Génération quittance (si payé)
  - Sauvegarde automatique

#### `Financement.tsx`
- **Rôle** : Gestion financement crédit
- **Fonctionnalités** :
  - Édition informations crédit
  - Calcul progression avec amortissement dégressif
  - Deux barres progression (temporelle + capital)
  - Affichage capital remboursé/restant

#### `Charges.tsx`
- **Rôle** : Gestion charges mensuelles
- **Fonctionnalités** :
  - Édition 5 types charges
  - Sauvegarde en temps réel

#### `Locataire.tsx`
- **Rôle** : Gestion locataire
- **Fonctionnalités** :
  - Édition informations locataire
  - Gestion APL
  - Mode de paiement

#### `QuittanceModal.tsx`
- **Rôle** : Modal génération quittance
- **Fonctionnalités** :
  - Affichage résumé loyer
  - Champs dates paiement modifiables
  - Téléchargement PDF
  - Envoi email locataire

#### `EnrichissementForms.tsx`
- **Rôle** : Formulaires enrichissement bien
- **Fonctionnalités** :
  - Formulaire financement (avec calcul mensualité)
  - Formulaire investissement
  - Calcul automatique capital restant dû
  - Sauvegarde enrichissement

### Composants Layout

#### `Sidebar.tsx`
- **Rôle** : Navigation principale
- **Fonctionnalités** :
  - Liste biens (expandable)
  - Navigation routes
  - Bouton "Ajouter un bien" (limité par plan)
  - Tooltip limite atteinte
  - Déconnexion
  - Refresh automatique

### Composants Abonnement

#### `UpgradeButton.tsx`
- **Rôle** : Bouton upgrade plan
- **Fonctionnalités** :
  - Création session Stripe Checkout
  - Gestion erreurs
  - Logs debug (Price ID, User ID)

#### `UpgradeModal.tsx`
- **Rôle** : Modal limite atteinte
- **Fonctionnalités** :
  - Affichage limite actuelle
  - CTA vers page abonnement
  - Design élégant

### Composants Paramètres

#### `ParametresClient.tsx`
- **Rôle** : Gestion paramètres utilisateur
- **Fonctionnalités** :
  - Édition nom
  - Paramètres notifications (à implémenter)
  - Gestion abonnement (à améliorer)

---

## 🔌 API ROUTES

### `POST /api/create-checkout`
- **Rôle** : Créer session Stripe Checkout
- **Body** :
  ```json
  {
    "priceId": "price_xxx",
    "userId": "user_xxx"
  }
  ```
- **Réponse** :
  ```json
  {
    "url": "https://checkout.stripe.com/xxx"
  }
  ```
- **Erreurs** : 400 si priceId/userId manquant, 500 si erreur Stripe

### `POST /api/send-quittance`
- **Rôle** : Envoyer quittance par email
- **Body** :
  ```json
  {
    "pdfBase64": "base64_string",
    "locataireEmail": "email@example.com",
    "locataireNom": "Dupont",
    "locatairePrenom": "Jean",
    "mois": 1,
    "annee": 2024,
    "bienNom": "Appartement Paris"
  }
  ```
- **Réponse** :
  ```json
  {
    "success": true,
    "data": {...}
  }
  ```
- **Service** : Resend

### `POST /api/webhooks/stripe`
- **Rôle** : Gérer webhooks Stripe
- **Événements** :
  - `checkout.session.completed` : Mise à jour plan après paiement
  - `customer.subscription.updated` : Changement plan
  - `customer.subscription.deleted` : Rétrogradation plan Découverte
- **Sécurité** : Vérification signature webhook
- **Actions** : Mise à jour table `profiles` (plan_type, stripe_customer_id, stripe_subscription_id)

---

## 🔄 SCHÉMA FONCTIONNEL

### Flow utilisateur type

1. **Inscription**
   - Accès `/signup`
   - Saisie email
   - Réception code OTP
   - Vérification `/verify-otp`
   - Création profil automatique (plan 'decouverte')
   - Redirection `/dashboard`

2. **Création bien**
   - Clic "Ajouter un bien" (Sidebar)
   - Vérification limite plan (2 biens max pour Découverte)
   - Si limite atteinte → Modal upgrade
   - Sinon → Modal création bien
   - Formulaire : nom, adresse, ville, code postal, type financement
   - Sauvegarde → Refresh dashboard

3. **Enrichissement bien**
   - Accès page bien `/biens/[id]`
   - Onglets disponibles :
     - **Vue d'ensemble** : Résumé + statut
     - **Loyers** : Grille 12 mois + paiements
     - **Charges** : Édition charges mensuelles
     - **Financement** : Infos crédit + progression
     - **Locataire** : Infos locataire
     - **Investissement** : Coûts acquisition
     - **Rentabilité** : Calculs ROI
     - **Historique** : Revenus/charges années précédentes
     - **Documents** : Upload documents

4. **Génération quittance**
   - Onglet Loyers → Clic mois payé
   - Modal quittance s'ouvre
   - Modification dates paiement (optionnel)
   - Téléchargement PDF ou envoi email
   - Email envoyé via Resend avec PDF joint

5. **Upgrade plan**
   - Limite atteinte → Modal upgrade
   - Clic "Voir les plans" → `/abonnement`
   - Choix plan Essentiel ou Premium
   - Clic "Passer au plan supérieur"
   - Redirection Stripe Checkout
   - Paiement
   - Webhook met à jour plan
   - Redirection `/abonnement?success=true`
   - Limite débloquée

6. **Dashboard**
   - Vue d'ensemble patrimoine
   - Graphique évolution 20 ans
   - Liste biens avec statuts
   - KPI (cash-flow, patrimoine, etc.)

---

## 📊 FONCTIONS DATABASE (lib/database.ts)

### Biens
- `getBiens(userId, supabaseClient?)` : Liste tous les biens d'un utilisateur
- `getBien(bienId, supabaseClient?)` : Récupère un bien par ID
- `createBien(userId, bien)` : Crée un bien (avec vérification limite plan)
- `updateBien(bienId, updates)` : Met à jour un bien
- `deleteBien(bienId)` : Supprime un bien

### Profils
- `getUserProfile(userId, supabaseClient?)` : Récupère le profil utilisateur
- `createUserProfile(userId, email, name?)` : Crée un profil (auto à l'inscription)
- `updateUserProfile(userId, updates)` : Met à jour le profil

### Locataires
- `getLocataire(bienId, supabaseClient?)` : Récupère le locataire d'un bien
- `upsertLocataire(bienId, locataireData, supabaseClient?)` : Crée ou met à jour locataire

### Loyers
- `getLoyers(bienId, annee, supabaseClient?)` : Récupère les loyers d'une année
- `upsertLoyer(bienId, annee, mois, loyerData, supabaseClient?)` : Crée ou met à jour un loyer

---

## 🎨 DESIGN SYSTEM

### Thème
- **Framework** : Tailwind CSS 4
- **Mode sombre** : Supporté (dark mode)
- **Couleurs principales** :
  - Primary : Indigo/Purple (gradients)
  - Success : Emerald/Green
  - Warning : Amber/Orange
  - Error : Red
- **Composants UI** : shadcn/ui (Radix UI + Tailwind)

### Responsive
- Mobile-first design
- Breakpoints Tailwind standards
- Sidebar responsive (collapse sur mobile)

---

## 🔒 SÉCURITÉ

### Authentification
- Supabase Auth (OTP par email)
- Session gérée par Supabase
- Middleware protection routes
- RLS (Row Level Security) sur Supabase

### Validation
- Côté client : Validation formulaires (React Hook Form + Zod)
- Côté serveur : Vérification limites plan
- Webhooks Stripe : Vérification signature

### Données sensibles
- Clés API dans variables d'environnement
- Service Role Key uniquement côté serveur
- Anon Key côté client (avec RLS)

---

## 📝 NOTES TECHNIQUES

### Calculs financiers
- **Amortissement dégressif** : Utilisé partout (cohérence)
- **Formule standard** : Basée sur mensualité constante
- **Précision** : Calculs en nombre (pas de Decimal Prisma côté client)

### Performance
- Server Components pour données initiales
- Client Components pour interactivité
- Refresh sélectif (router.refresh())
- Pas de cache explicite (à optimiser)

### Gestion d'erreurs
- Try/catch dans fonctions async
- Logs console pour debug
- Messages erreur utilisateur (alert/UI)
- Gestion erreurs API (NextResponse)

---

## 🚀 DÉPLOIEMENT

### Prérequis
- Node.js 20+
- Base de données Supabase
- Compte Stripe
- Compte Resend
- Variables d'environnement configurées

### Build
```bash
npm run build
npm start
```

### Environnement
- Production : Variables d'environnement à configurer
- Développement : `.env.local` avec toutes les variables

---

## 📚 DOCUMENTATION COMPLÉMENTAIRE

### Fichiers d'audit existants
- `AUDIT_COMPLET.md` : Audit initial
- `AUDIT_FLOWS_DONNEES.md` : Audit flux de données
- `RAPPORT_AUDIT_COMPLET.md` : Rapport audit détaillé
- `RESUME_CORRECTIONS.md` : Résumé corrections apportées

### Scripts SQL
- `scripts/add-missing-columns.sql` : Ajout colonnes manquantes
- `scripts/add-profiles-columns.sql` : Colonnes profiles
- `scripts/add-stripe-columns.sql` : Colonnes Stripe
- `scripts/create-all-missing-columns.sql` : Toutes colonnes
- `scripts/create-locataires-loyers-tables.sql` : Tables locataires/loyers

---

**Dernière mise à jour** : Après correction calcul amortissement dégressif (V1.5) et dates paiement quittances (V1.6)

**Version du rapport** : 1.0

---

*Ce rapport est exhaustif et couvre tous les aspects techniques et fonctionnels du SaaS Patrimo. Il peut être utilisé pour un audit complet, une onboarding développeur, ou une documentation technique.*
