# Patrimoine Immo 🏠

[![Tests](https://github.com/timaelia1-mgt/patrimoine-immo/actions/workflows/ci.yml/badge.svg)](https://github.com/timaelia1-mgt/patrimoine-immo/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](./coverage)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

Application de gestion de patrimoine immobilier construite avec Next.js 16, TypeScript et Supabase.

## ✨ Fonctionnalités

- 📊 **Dashboard** - Vue d'ensemble de votre patrimoine
- 🏢 **Gestion des biens** - CRUD complet pour vos biens immobiliers
- 💰 **Suivi des loyers** - Gestion des paiements et quittances
- 📈 **Calculs de rentabilité** - Cash-flow, TRI, taux d'autofinancement
- 📄 **Génération PDF** - Quittances et rapports annuels
- 📤 **Export Excel/CSV** - Exportez vos données
- 🔐 **Authentification** - Sécurisé avec Supabase Auth
- 💳 **Abonnements** - Plans tarifaires avec Stripe

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- npm ou yarn
- Compte Supabase
- Compte Stripe (pour les paiements)

### Installation

```bash
# Cloner le repository
git clone https://github.com/timaelia1-mgt/patrimoine-immo.git
cd patrimoine-immo

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Variables d'environnement

Copiez `.env.example` vers `.env.local` et remplissez les valeurs :

```bash
cp .env.example .env.local
```

Consultez [`.env.example`](.env.example) pour la liste complète des variables requises.

**Variables critiques** :

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase (serveur) | ✅ Oui |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | ⚠️ Pour paiements |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | ⚠️ Pour paiements |
| `RESEND_API_KEY` | Clé API Resend | ⚠️ Pour emails |
| `NEXT_PUBLIC_APP_URL` | URL de l'application | ✅ Oui |

> 💡 Pour le développement local, seules les variables Supabase sont strictement nécessaires. Les fonctionnalités Stripe et Resend seront désactivées sans leurs clés.

## 🚀 Déploiement

### Vercel (recommandé)

1. Connectez votre repository GitHub à [Vercel](https://vercel.com)
2. Configurez les variables d'environnement (voir `.env.example`)
3. Déployez !

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/timaelia1-mgt/patrimoine-immo)

### Configuration Supabase Production

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Exécutez les scripts SQL dans `/scripts/` pour créer les tables
3. Activez l'authentification par email OTP dans Authentication > Providers
4. Configurez les URLs de redirection dans Authentication > URL Configuration

### Configuration Stripe Production

1. Passez en mode Live sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Créez les produits "Essentiel" (9€/mois) et "Premium" (19€/mois)
3. Configurez un webhook vers `https://votre-domaine.com/api/webhooks/stripe`
4. Événements requis : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### Autres plateformes

L'application est compatible avec toute plateforme supportant Next.js 16+ (Netlify, Railway, Render, etc.)

## 🧪 Tests

L'application dispose d'une suite complète de **218 tests automatisés**.

```bash
# Lancer les tests
npm run test

# Tests rapides (sans coverage)
npm run test:quick

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests avec coverage
npm run test:coverage

# Interface UI pour les tests
npm run test:ui

# Validation complète (lint + tests + build)
npm run validate
```

### Coverage

| Type | Coverage |
|------|----------|
| **Code critique** | 85-100% |
| **Routes API** | 93-100% |
| **Composants** | 70-85% |

### Documentation

- 📖 [`__tests__/README.md`](__tests__/README.md) - Statistiques et structure des tests
- 📝 [`TESTING.md`](TESTING.md) - Guidelines pour écrire des tests

### Structure des tests

```
__tests__/
├── lib/                    # Tests unitaires (135 tests)
│   ├── calculations.test.ts
│   ├── database.test.ts
│   ├── generateQuittance.test.ts
│   ├── logger.test.ts
│   └── validations.test.ts
├── api/                    # Tests API (35 tests)
│   ├── auth/
│   ├── biens/
│   └── export/
├── components/             # Tests composants (48 tests)
│   ├── DashboardClient.test.tsx
│   ├── Sidebar.test.tsx
│   └── ExportExcelButton.test.tsx
└── mocks/                  # Mocks partagés
    ├── supabase.ts
    └── nextRequest.ts
```

## 📁 Structure du projet

```
patrimoine-immo/
├── app/                    # Routes Next.js App Router
│   ├── api/               # Routes API
│   ├── dashboard/         # Pages dashboard
│   ├── biens/             # Pages détail bien
│   └── ...
├── components/             # Composants React
│   ├── ui/                # Composants UI (shadcn)
│   ├── dashboard/         # Composants dashboard
│   ├── biens/             # Composants biens
│   └── layout/            # Layout (Sidebar, etc.)
├── lib/                    # Utilitaires et logique métier
│   ├── database.ts        # Fonctions CRUD Supabase
│   ├── calculations.ts    # Calculs financiers
│   └── ...
└── __tests__/             # Tests
```

## 🔧 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer en production |
| `npm run lint` | Linter ESLint |
| `npm run test` | Tests en mode interactif |
| `npm run test:run` | Tests en une seule exécution |
| `npm run test:quick` | Tests rapides (sans coverage) |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run test:ui` | Interface UI Vitest |
| `npm run test:watch` | Tests en mode watch |
| `npm run validate` | Lint + Tests + Build |

## 🛠️ Technologies

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Langage** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Base de données** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentification** | Supabase Auth (OTP email) |
| **Paiements** | [Stripe](https://stripe.com/) |
| **UI** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Tests** | [Vitest 4](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) |
| **Graphiques** | [Recharts](https://recharts.org/) |
| **PDF** | [jsPDF](https://parall.ax/products/jspdf) |
| **Emails** | [Resend](https://resend.com/) |
| **Validation** | [Zod](https://zod.dev/) |

## 📊 Coverage

| Module | Coverage |
|--------|----------|
| `lib/database.ts` | 85%+ |
| `lib/calculations.ts` | 91%+ |
| `lib/generateQuittance.ts` | 100% |
| `api/auth/signup` | 100% |
| `api/export/excel` | 100% |

## 🤝 Contribution

Les contributions sont les bienvenues ! 

### Processus rapide

1. **Fork** le projet
2. **Créez** une branche (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Pushez** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Guidelines

- Suivez les conventions de code existantes (ESLint)
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Consultez [`TESTING.md`](TESTING.md) pour les guidelines de tests

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`README.md`](README.md) | Ce fichier - guide de démarrage |
| [`API.md`](API.md) | 📡 Documentation complète de l'API REST |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | 🚀 Guide de déploiement Vercel/Supabase/Stripe |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 🤝 **Guide de contribution** |
| [`CHANGELOG.md`](CHANGELOG.md) | 📝 Historique des versions |
| [`TESTING.md`](TESTING.md) | 🧪 Guidelines pour écrire des tests |
| [`__tests__/README.md`](__tests__/README.md) | 📊 Statistiques et structure des tests |
| [`RAPPORT_PATRIMO.md`](RAPPORT_PATRIMO.md) | 🏗️ Architecture complète du projet |
| [`docs/JSDOC.md`](docs/JSDOC.md) | 📖 Documentation des fonctions (JSDoc) |
| [`.env.example`](.env.example) | ⚙️ Variables d'environnement requises |

## 📄 Licence

MIT © Patrimoine Immo

---

<p align="center">
  Fait avec ❤️ pour la gestion de patrimoine immobilier
</p>
