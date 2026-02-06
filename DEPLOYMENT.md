# 🚀 Guide de Déploiement - Patrimoine Immo

Ce guide vous accompagne pour déployer l'application en production sur Vercel.

## 📋 Prérequis

- [ ] Compte [Vercel](https://vercel.com) (gratuit)
- [ ] Compte [Supabase](https://supabase.com) (gratuit)
- [ ] Compte [Stripe](https://stripe.com) (mode test OK pour commencer)
- [ ] Compte [Resend](https://resend.com) (gratuit)
- [ ] Repository GitHub avec le code

## 🎯 Vue d'ensemble

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Vercel    │────▶│  Utilisateur│
│  (Source)   │     │  (Hosting)  │     │  (Browser)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Supabase   │ │   Stripe    │ │   Resend    │
    │  (BDD+Auth) │ │ (Paiements) │ │  (Emails)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

**Flux de déploiement** :
1. Push sur `main` → GitHub
2. Vercel détecte le changement → Build automatique
3. Tests CI passent → Déploiement en production
4. L'app communique avec Supabase, Stripe et Resend

---

## 1️⃣ Configuration Supabase

### Créer le projet

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Cliquez sur **New Project**
3. Configurez :
   - **Name** : `patrimoine-immo-prod`
   - **Database Password** : Générez un mot de passe fort (notez-le !)
   - **Region** : Choisissez la plus proche de vos utilisateurs (ex: `eu-west-3` pour Paris)
4. Attendez ~2 minutes que le projet soit créé

### Récupérer les credentials

Allez dans **Settings → API** et notez :

| Variable | Où la trouver | Usage |
|----------|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Client & Serveur |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public | Client (navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | Serveur uniquement ⚠️ |

> ⚠️ **ATTENTION** : La clé `service_role` donne un accès total à votre base de données. Ne l'exposez JAMAIS côté client !

### Créer les tables

Allez dans **SQL Editor** et exécutez les scripts dans l'ordre :

#### 1. Table `profiles`

```sql
-- Table profiles (extension de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan_type TEXT DEFAULT 'decouverte' CHECK (plan_type IN ('decouverte', 'essentiel', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  currency TEXT DEFAULT 'EUR',
  rent_payment_day INTEGER DEFAULT 5,
  payment_delay_days INTEGER DEFAULT 5,
  email_alerts_enabled BOOLEAN DEFAULT true,
  app_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_profiles_email ON profiles(email);
```

#### 2. Table `biens`

```sql
-- Table biens
CREATE TABLE IF NOT EXISTS biens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  type_financement TEXT NOT NULL CHECK (type_financement IN ('credit', 'comptant')),
  loyer_mensuel DECIMAL(10,2) NOT NULL DEFAULT 0,
  charges_mensuelles DECIMAL(10,2) DEFAULT 0,
  taxe_fonciere DECIMAL(10,2) DEFAULT 0,
  charges_copro DECIMAL(10,2) DEFAULT 0,
  assurance DECIMAL(10,2) DEFAULT 0,
  frais_gestion DECIMAL(10,2) DEFAULT 0,
  autres_charges DECIMAL(10,2) DEFAULT 0,
  montant_credit DECIMAL(12,2),
  taux_credit DECIMAL(5,3),
  duree_credit INTEGER,
  mensualite_credit DECIMAL(10,2),
  date_debut_credit TIMESTAMP WITH TIME ZONE,
  capital_restant_du DECIMAL(12,2),
  prix_achat DECIMAL(12,2),
  frais_notaire DECIMAL(10,2),
  travaux_initiaux DECIMAL(10,2),
  autres_frais DECIMAL(10,2),
  date_acquisition TIMESTAMP WITH TIME ZONE,
  date_mise_en_location TIMESTAMP WITH TIME ZONE,
  revenus_anterieurs_override DECIMAL(12,2),
  charges_anterieures_override DECIMAL(12,2),
  enrichissement_financement BOOLEAN DEFAULT false,
  enrichissement_investissement BOOLEAN DEFAULT false,
  enrichissement_historique BOOLEAN DEFAULT false,
  enrichissement_rentabilite BOOLEAN DEFAULT false,
  enrichissement_charges BOOLEAN DEFAULT false,
  enrichissement_locataire BOOLEAN DEFAULT false,
  enrichissement_depenses BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_biens_user_id ON biens(user_id);
CREATE INDEX idx_biens_created_at ON biens(created_at DESC);
```

#### 3. Table `locataires`

```sql
-- Table locataires
CREATE TABLE IF NOT EXISTS locataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id UUID REFERENCES biens(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  date_entree TIMESTAMP WITH TIME ZONE,
  montant_apl DECIMAL(10,2) DEFAULT 0 NOT NULL,
  mode_paiement TEXT DEFAULT 'virement' CHECK (mode_paiement IN ('virement', 'cheque', 'especes', 'prelevement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_locataires_bien_id ON locataires(bien_id);
```

#### 4. Table `loyers`

```sql
-- Table loyers
CREATE TABLE IF NOT EXISTS loyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id UUID REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois >= 0 AND mois <= 11),
  montant_locataire DECIMAL(10,2) NOT NULL,
  montant_apl DECIMAL(10,2) NOT NULL DEFAULT 0,
  paye_locataire BOOLEAN DEFAULT false NOT NULL,
  paye_apl BOOLEAN DEFAULT false NOT NULL,
  date_paiement_locataire TIMESTAMP WITH TIME ZONE,
  date_paiement_apl TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bien_id, annee, mois)
);

-- Index
CREATE INDEX idx_loyers_bien_id ON loyers(bien_id);
CREATE INDEX idx_loyers_annee_mois ON loyers(annee, mois);
```

#### 5. Table `quittances`

```sql
-- Table quittances
CREATE TABLE IF NOT EXISTS quittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bien_id UUID REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  locataire_nom TEXT NOT NULL,
  locataire_prenom TEXT NOT NULL,
  locataire_email TEXT,
  montant_locataire DECIMAL(10,2) NOT NULL,
  montant_apl DECIMAL(10,2) DEFAULT 0,
  montant_total DECIMAL(10,2) NOT NULL,
  date_paye_locataire TEXT NOT NULL,
  date_paye_apl TEXT,
  mode_paiement TEXT NOT NULL,
  email_envoye BOOLEAN DEFAULT false,
  date_envoi_email TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_quittances_bien_id ON quittances(bien_id);
CREATE INDEX idx_quittances_user_id ON quittances(user_id);
```

#### 6. Table `investissements_secondaires`

```sql
-- Table investissements_secondaires
CREATE TABLE IF NOT EXISTS investissements_secondaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id UUID REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_inv_sec_bien_id ON investissements_secondaires(bien_id);
```

### Configurer RLS (Row Level Security)

⚠️ **IMPORTANT** : RLS protège vos données en s'assurant que chaque utilisateur ne voit que SES propres données.

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE locataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE investissements_secondaires ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========== BIENS ==========
CREATE POLICY "Users can view own biens"
  ON biens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biens"
  ON biens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biens"
  ON biens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own biens"
  ON biens FOR DELETE
  USING (auth.uid() = user_id);

-- ========== LOCATAIRES ==========
CREATE POLICY "Users can view own locataires"
  ON locataires FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = locataires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own locataires"
  ON locataires FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = locataires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own locataires"
  ON locataires FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = locataires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own locataires"
  ON locataires FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = locataires.bien_id AND biens.user_id = auth.uid()
  ));

-- ========== LOYERS ==========
CREATE POLICY "Users can view own loyers"
  ON loyers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = loyers.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own loyers"
  ON loyers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = loyers.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own loyers"
  ON loyers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = loyers.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own loyers"
  ON loyers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = loyers.bien_id AND biens.user_id = auth.uid()
  ));

-- ========== QUITTANCES ==========
CREATE POLICY "Users can view own quittances"
  ON quittances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quittances"
  ON quittances FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = quittances.bien_id AND biens.user_id = auth.uid()
  ));

-- ========== INVESTISSEMENTS SECONDAIRES ==========
CREATE POLICY "Users can view own investissements"
  ON investissements_secondaires FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = investissements_secondaires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own investissements"
  ON investissements_secondaires FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = investissements_secondaires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own investissements"
  ON investissements_secondaires FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = investissements_secondaires.bien_id AND biens.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own investissements"
  ON investissements_secondaires FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM biens WHERE biens.id = investissements_secondaires.bien_id AND biens.user_id = auth.uid()
  ));
```

### Configurer l'authentification

1. Allez dans **Authentication → Providers**
2. Activez le provider **Email**
3. Configuration recommandée :
   - **Confirm email** : ✅ Activé en production
   - **Double confirm email changes** : ✅ Activé
   - **Enable new user signups** : ✅ Activé

4. Allez dans **Authentication → URL Configuration**
5. Configurez les URLs de redirection :
   - **Site URL** : `https://votre-app.vercel.app`
   - **Redirect URLs** : `https://votre-app.vercel.app/**`

---

## 2️⃣ Configuration Stripe

### Obtenir les clés API

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers → API keys**
3. Récupérez :

| Variable | Clé | Mode |
|----------|-----|------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key | `pk_test_...` ou `pk_live_...` |
| `STRIPE_SECRET_KEY` | Secret key | `sk_test_...` ou `sk_live_...` |

> 💡 Utilisez les clés **test** pour le développement, **live** pour la production.

### Créer les produits

1. Allez dans **Products → Add product**

#### Produit 1 : Plan Essentiel

- **Name** : Essentiel
- **Description** : Jusqu'à 5 biens, quittances PDF, export Excel
- **Pricing** :
  - Prix : `9.00 €`
  - Billing period : Monthly
  - ✅ Recurring
- Cliquez sur **Add product**
- Copiez le **Price ID** (commence par `price_`) → `NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL`

#### Produit 2 : Plan Premium

- **Name** : Premium
- **Description** : Biens illimités, toutes les fonctionnalités, support prioritaire
- **Pricing** :
  - Prix : `19.00 €`
  - Billing period : Monthly
  - ✅ Recurring
- Cliquez sur **Add product**
- Copiez le **Price ID** → `NEXT_PUBLIC_STRIPE_PRICE_PREMIUM`

### Configurer le Webhook

1. Allez dans **Developers → Webhooks**
2. Cliquez sur **Add endpoint**
3. Configurez :
   - **Endpoint URL** : `https://votre-app.vercel.app/api/webhooks/stripe`
   - **Events to send** :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. Cliquez sur **Add endpoint**
5. Cliquez sur **Reveal** sous "Signing secret"
6. Copiez le secret → `STRIPE_WEBHOOK_SECRET` (commence par `whsec_`)

### Tester le webhook en local (optionnel)

```bash
# Installer Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows (avec scoop)
scoop install stripe

# Connexion
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Déclencher un événement test
stripe trigger checkout.session.completed
```

---

## 3️⃣ Configuration Resend

### Obtenir la clé API

1. Allez sur [resend.com](https://resend.com)
2. **API Keys → Create API Key**
3. Donnez un nom (ex: `patrimoine-immo-prod`)
4. Copiez la clé → `RESEND_API_KEY` (commence par `re_`)

### Configurer le domaine d'envoi

#### Option 1 : Mode développement/test
Utilisez l'adresse par défaut :
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```
> ⚠️ Limité à votre propre email pour les tests.

#### Option 2 : Production avec domaine personnalisé

1. **Domains → Add Domain**
2. Ajoutez votre domaine (ex: `mail.votre-app.com`)
3. Ajoutez les enregistrements DNS fournis :
   - 3 enregistrements TXT (SPF, DKIM)
   - 1 enregistrement MX (optionnel)
4. Attendez la vérification (quelques minutes à 48h)
5. Utilisez :
```
RESEND_FROM_EMAIL=noreply@votre-app.com
```

---

## 4️⃣ Déploiement Vercel

### Étape 1 : Connecter le repository

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **Add New... → Project**
3. **Import Git Repository** : Sélectionnez `patrimoine-immo`
4. Vercel détecte automatiquement Next.js

### Étape 2 : Configurer les variables d'environnement

Dans la section **Environment Variables**, ajoutez TOUTES les variables :

```bash
# ========== SUPABASE ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# ========== STRIPE ==========
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_xxxxx

# ========== RESEND ==========
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@votre-app.com

# ========== APPLICATION ==========
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

> ⚠️ **Important** : 
> - Utilisez les clés de **production** (pas de `_test_`)
> - Mettez à jour l'URL de l'app avec votre vrai domaine

### Étape 3 : Déployer

1. Cliquez sur **Deploy**
2. Attendez le build (~2-3 minutes)
3. ✅ Votre app est en ligne !

### Étape 4 : Configurer le domaine personnalisé (optionnel)

1. Allez dans **Settings → Domains**
2. Ajoutez votre domaine (ex: `app.votre-site.com`)
3. Configurez les DNS selon les instructions Vercel :
   - **A Record** : `76.76.21.21`
   - **CNAME** : `cname.vercel-dns.com`
4. Attendez la propagation DNS (jusqu'à 48h)
5. **Mettez à jour** `NEXT_PUBLIC_APP_URL` avec votre nouveau domaine
6. **Mettez à jour** l'URL du webhook Stripe avec le nouveau domaine

---

## 5️⃣ Vérifications post-déploiement

### ✅ Checklist de vérification

| Fonctionnalité | Test | Résultat |
|----------------|------|----------|
| Accès à l'app | L'URL se charge sans erreur | ☐ |
| Inscription | Créer un nouveau compte | ☐ |
| Vérification OTP | Recevoir et valider le code | ☐ |
| Connexion | Se connecter avec le compte créé | ☐ |
| Création bien | Ajouter un nouveau bien | ☐ |
| Modification bien | Éditer les informations | ☐ |
| Ajout locataire | Ajouter un locataire au bien | ☐ |
| Paiement loyer | Marquer un loyer comme payé | ☐ |
| Génération quittance | Télécharger une quittance PDF | ☐ |
| Envoi email | Envoyer une quittance par email | ☐ |
| Paiement Stripe | Souscrire à un plan payant | ☐ |
| Upgrade plan | Limite de biens augmentée | ☐ |

### Tester manuellement

```bash
# 1. Accéder à l'app
open https://votre-app.vercel.app

# 2. Créer un compte test
# 3. Ajouter un bien
# 4. Tester toutes les fonctionnalités

# 5. Tester le paiement Stripe (mode test)
# Utilisez la carte : 4242 4242 4242 4242
```

### Vérifier les logs

| Service | Où trouver les logs |
|---------|---------------------|
| **Vercel** | Deployments → Cliquez sur un déploiement → Logs |
| **Supabase** | Logs → API Logs / Auth Logs / Postgres Logs |
| **Stripe** | Developers → Logs |
| **Resend** | Emails → Activity |

---

## 🔧 Maintenance

### Déploiements automatiques

Les déploiements sont **automatiques** avec Vercel :

1. **Push sur `main`** → Build & déploiement automatique
2. **Pull Request** → Preview deployment (URL temporaire)
3. **Merge PR** → Déploiement en production

### Workflow recommandé

```
feature-branch ──PR──▶ main ──auto-deploy──▶ Production
       │                │
       └── Preview ◀────┘
```

### Rollback en cas de problème

1. Allez dans **Vercel → Deployments**
2. Trouvez le dernier déploiement fonctionnel
3. Cliquez sur **"..."** → **Promote to Production**
4. Le rollback est instantané !

### Sauvegardes Supabase

Supabase effectue des backups automatiques :

| Plan | Rétention |
|------|-----------|
| Free | 7 jours |
| Pro | 30 jours |

Pour restaurer :
1. **Database → Backups**
2. Sélectionnez une date
3. Cliquez sur **Restore**

### Mettre à jour les dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour (attention aux breaking changes)
npm update

# Tester localement
npm run test
npm run build

# Si tout fonctionne, commit et push
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

---

## 🆘 Troubleshooting

### L'app ne se charge pas

**Symptômes** : Page blanche, erreur 500, "Application error"

**Solutions** :
1. Vérifiez les logs Vercel (Deployments → Logs)
2. Vérifiez que TOUTES les variables d'environnement sont définies
3. Vérifiez que les clés sont correctes (pas d'espaces, pas de guillemets)
4. Testez en local avec les mêmes env vars

```bash
# Tester le build en local
npm run build
```

### Erreur Supabase "Invalid API key"

**Causes possibles** :
- Mauvaise clé API
- Clés d'un autre projet
- Clé expirée ou regénérée

**Solutions** :
1. Vérifiez que vous utilisez les clés du BON projet
2. Régénérez les clés si nécessaire (Settings → API → Regenerate)
3. Mettez à jour les variables dans Vercel
4. Redéployez

### Webhook Stripe ne fonctionne pas

**Symptômes** : Le plan ne se met pas à jour après paiement

**Solutions** :
1. Vérifiez l'URL du webhook dans Stripe Dashboard
2. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
3. Consultez les logs webhook dans Stripe (Developers → Webhooks → votre endpoint → Logs)
4. Testez avec Stripe CLI :

```bash
stripe trigger checkout.session.completed
```

### Emails ne partent pas

**Symptômes** : Quittances non reçues, pas de confirmation

**Solutions** :
1. Vérifiez `RESEND_API_KEY` est correct
2. Vérifiez que `RESEND_FROM_EMAIL` est vérifié dans Resend
3. Consultez les logs dans Resend (Emails → Activity)
4. En mode test, vérifiez que vous envoyez à votre propre email

### Erreur "Limite de biens atteinte"

**Causes** : Plan pas mis à jour après paiement

**Solutions** :
1. Vérifiez le webhook Stripe
2. Vérifiez dans Supabase que `plan_type` est correct
3. Mettez à jour manuellement si nécessaire :

```sql
UPDATE profiles 
SET plan_type = 'premium' 
WHERE email = 'user@example.com';
```

---

## 🔐 Sécurité

### Variables secrètes

⚠️ **NE JAMAIS exposer ou committer** :

| Variable | Risque si exposée |
|----------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Accès total à la BDD |
| `STRIPE_SECRET_KEY` | Accès aux paiements |
| `STRIPE_WEBHOOK_SECRET` | Usurpation de webhooks |
| `RESEND_API_KEY` | Envoi d'emails non autorisés |

### Best practices

1. **Utilisez les clés de test en développement**
   - `pk_test_`, `sk_test_` pour Stripe
   - Projet Supabase séparé pour le dev

2. **Activez 2FA sur tous les services**
   - Vercel, Supabase, Stripe, Resend, GitHub

3. **Rotez les clés régulièrement**
   - Tous les 6 mois minimum
   - Immédiatement si suspicion de fuite

4. **Activez RLS sur Supabase**
   - Obligatoire pour protéger les données

5. **Vérifiez les signatures webhook**
   - Déjà implémenté dans `/api/webhooks/stripe`

6. **Utilisez HTTPS uniquement**
   - Vercel force HTTPS automatiquement

### En cas de fuite de clé

1. **Révoquez immédiatement** la clé compromise
2. **Générez une nouvelle clé**
3. **Mettez à jour** dans Vercel
4. **Vérifiez les logs** pour activité suspecte
5. **Informez les utilisateurs** si données compromises

---

## 📚 Ressources

### Documentation officielle

| Service | Lien |
|---------|------|
| Vercel | [vercel.com/docs](https://vercel.com/docs) |
| Supabase | [supabase.com/docs](https://supabase.com/docs) |
| Stripe | [stripe.com/docs](https://stripe.com/docs) |
| Resend | [resend.com/docs](https://resend.com/docs) |
| Next.js | [nextjs.org/docs](https://nextjs.org/docs) |

### Support

- **Vercel** : [vercel.com/support](https://vercel.com/support)
- **Supabase** : [supabase.com/support](https://supabase.com/support)
- **Stripe** : [support.stripe.com](https://support.stripe.com)
- **Resend** : [resend.com/support](https://resend.com/support)

### Communauté

- [Discord Supabase](https://discord.supabase.com)
- [Discord Vercel](https://vercel.com/discord)
- [GitHub Discussions](https://github.com/timaelia1-mgt/patrimoine-immo/discussions)

---

## 📝 Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] Toutes les tables Supabase créées
- [ ] RLS activé sur toutes les tables
- [ ] Authentification OTP configurée
- [ ] Produits Stripe créés (Essentiel + Premium)
- [ ] Webhook Stripe configuré et testé
- [ ] Clé Resend configurée
- [ ] Toutes les env vars dans Vercel
- [ ] App déployée et accessible
- [ ] Tests manuels passés
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] URLs mises à jour (Supabase, Stripe, NEXT_PUBLIC_APP_URL)

---

**Dernière mise à jour** : Février 2026  
**Version** : 1.0

---

<p align="center">
  <strong>🎉 Félicitations ! Votre app est en production !</strong>
</p>
