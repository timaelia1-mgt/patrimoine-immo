# Patrimoine Immo 🏠

[![CI](https://github.com/YOUR_USERNAME/patrimoine-immo/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/patrimoine-immo/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/patrimoine-immo/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/patrimoine-immo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Application de gestion de patrimoine immobilier construite avec Next.js 14, TypeScript et Supabase.

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
git clone https://github.com/YOUR_USERNAME/patrimoine-immo.git
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

- **Framework** : [Next.js 14](https://nextjs.org/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Base de données** : [Supabase](https://supabase.com/)
- **Authentification** : Supabase Auth
- **Paiements** : [Stripe](https://stripe.com/)
- **UI** : [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Tests** : [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- **Charts** : [Recharts](https://recharts.org/)
- **PDF** : [jsPDF](https://parall.ax/products/jspdf)

## 📊 Coverage

| Module | Coverage |
|--------|----------|
| `lib/database.ts` | 85%+ |
| `lib/calculations.ts` | 91%+ |
| `lib/generateQuittance.ts` | 100% |
| `api/auth/signup` | 100% |
| `api/export/excel` | 100% |

## 📄 Licence

MIT © [Votre Nom]
