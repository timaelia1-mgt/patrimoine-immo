# 📝 Changelog

Tous les changements notables de ce projet sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Non publié]

### À venir
- 📊 Analytics et tableaux de bord avancés
- 📱 Application mobile (React Native)
- 🔌 API publique avec documentation OpenAPI
- 🌍 Multi-langue (i18n)
- 📈 Prévisions et simulations financières

---

## [1.6.0] - 2026-02-06

### ✨ Ajouté
- 📚 Documentation API complète (`API.md` - 750 lignes)
- 🚀 Guide de déploiement détaillé (`DEPLOYMENT.md` - 640 lignes)
- 🤝 Guide de contribution (`CONTRIBUTING.md`)
- 📝 Changelog structuré (`CHANGELOG.md`)
- ⚙️ Fichier `.env.example` avec toutes les variables
- ✅ Suite de tests complète (218 tests)
- 🔄 CI/CD GitHub Actions
- 📊 Coverage 85%+ sur code critique

### 🔧 Amélioré
- 📖 README.md enrichi avec badges, sections déploiement et contribution
- 📈 Performance : Bundle réduit de 780 KB (-65%)
- ⚡ Temps de chargement initial : -300ms
- 🎨 UI/UX des modals et formulaires

### 🐛 Corrigé
- Validation des dates de loyer côté serveur
- Calcul TRI avec valeurs limites
- Génération de quittances avec APL à 0€

---

## [1.5.0] - 2026-01-28

### ✨ Ajouté
- 📊 **Export Excel** : Export complet des biens avec calculs
- 📄 **Export PDF** : Rapport annuel professionnel
- 📥 **Import CSV** : Import en masse des biens
- 💾 **Backup JSON** : Sauvegarde complète des données
- 🔄 **Restauration** : Import depuis backup

### 🔧 Amélioré
- Formats de dates flexibles pour l'import CSV
- Validation des données à l'import
- Messages d'erreur plus explicites

### 🐛 Corrigé
- Export Excel avec caractères spéciaux
- Encodage UTF-8 des fichiers CSV
- Gestion des valeurs nulles dans les exports

---

## [1.4.0] - 2026-01-15

### ✨ Ajouté
- 📧 **Envoi d'emails** : Quittances envoyées par email (Resend)
- 📄 **Génération PDF** : Quittances de loyer professionnelles
- 📅 **Historique** : Liste des quittances générées par bien
- 🔄 **Régénération** : Possibilité de régénérer une quittance
- ✉️ **Templates** : Emails HTML professionnels

### 🔧 Amélioré
- 🎨 Design des quittances PDF (logo, mise en page)
- 📧 Templates emails avec branding
- 🔒 Validation des emails avant envoi

### 🐛 Corrigé
- Format des montants dans les quittances
- Dates localisées en français
- Pièce jointe PDF trop volumineuse

---

## [1.3.0] - 2026-01-05

### ✨ Ajouté
- 💳 **Paiements Stripe** : Intégration complète
- 📦 **Plans d'abonnement** :
  - Découverte (gratuit) : 2 biens max
  - Essentiel (9€/mois) : 10 biens
  - Premium (19€/mois) : Illimité
- 🎫 **Webhooks Stripe** : Synchronisation automatique
- 💰 **Portail client** : Gestion des abonnements

### 🔧 Amélioré
- Page de pricing avec comparatif des plans
- Workflow d'upgrade/downgrade fluide
- Messages de limite de biens explicites

### 🐛 Corrigé
- Limite de biens non respectée après upgrade
- Synchronisation du statut d'abonnement
- Double facturation en cas d'erreur webhook

### 🔒 Sécurité
- Vérification de signature des webhooks Stripe
- Validation des prix côté serveur

---

## [1.2.0] - 2025-12-20

### ✨ Ajouté
- 📊 **Calculs automatiques** :
  - Rentabilité brute et nette
  - Cash-flow mensuel et annuel
  - TRI (Taux de Rentabilité Interne)
  - Taux d'autofinancement
- 📈 **Graphiques** :
  - Évolution du cash-flow (Recharts)
  - Répartition des charges
  - Historique des loyers
- 💰 **Indicateurs** : Badges visuels de performance

### 🔧 Amélioré
- 🧮 Formules de calcul optimisées
- 📊 Précision des graphiques (2 décimales)
- 🎨 Couleurs des indicateurs (vert/rouge)

### 🐛 Corrigé
- Division par zéro dans les calculs
- Arrondi des pourcentages
- Mise à jour temps réel des graphiques

---

## [1.1.0] - 2025-12-10

### ✨ Ajouté
- 👥 **Gestion des locataires** :
  - Informations personnelles
  - Date d'entrée/sortie
  - Mode de paiement préféré
- 💰 **Suivi des loyers** :
  - Grille mensuelle 12 mois
  - Statut payé/non payé
  - Montant locataire + APL séparés
- 📅 **Calendrier** : Vue des paiements attendus
- 🔔 **Alertes** : Notification des loyers impayés

### 🔧 Amélioré
- Interface de saisie des loyers
- Récapitulatif annuel des paiements
- Export des données de loyers

### 🐛 Corrigé
- Doublons dans l'historique des loyers
- Format des dates (FR vs US)
- Calcul des totaux avec APL

---

## [1.0.0] - 2025-12-01

### ✨ Ajouté
- 🏠 **CRUD Biens immobiliers** :
  - Création avec wizard multi-étapes
  - Modification de tous les champs
  - Suppression avec confirmation
  - Liste avec filtres et recherche
- 🔐 **Authentification** :
  - Inscription par email
  - Connexion OTP (sans mot de passe)
  - Session persistante
- 📊 **Dashboard** :
  - Vue d'ensemble du patrimoine
  - Statistiques clés
  - Liste des biens
- 🎨 **Interface** :
  - Design moderne avec Tailwind CSS
  - Composants shadcn/ui
  - Mode sombre automatique
  - Responsive mobile/desktop

### 🔒 Sécurité
- RLS (Row Level Security) Supabase
- Sessions sécurisées avec cookies HttpOnly
- Validation côté serveur de toutes les entrées
- Protection CSRF

---

## [0.1.0] - 2025-11-15

### ✨ Ajouté
- 🎯 **Setup initial** :
  - Projet Next.js 14 avec App Router
  - TypeScript strict
  - Configuration Supabase
  - Tailwind CSS + shadcn/ui
- ⚙️ **Configuration** :
  - ESLint + Prettier
  - Structure de dossiers
  - Variables d'environnement

---

## Légende des icônes

| Icône | Signification |
|-------|---------------|
| ✨ | Nouvelle fonctionnalité |
| 🔧 | Amélioration |
| 🐛 | Correction de bug |
| 🔒 | Sécurité |
| 📚 | Documentation |
| 🎨 | UI/UX |
| ⚡ | Performance |
| 💥 | Breaking change |
| 🗑️ | Suppression |

---

## Format des versions

Ce projet suit le [Semantic Versioning](https://semver.org/lang/fr/) :

```
MAJOR.MINOR.PATCH
```

- **MAJOR** : Changements incompatibles avec les versions précédentes
- **MINOR** : Nouvelles fonctionnalités rétro-compatibles
- **PATCH** : Corrections de bugs rétro-compatibles

---

## Contribuer au Changelog

Lors de vos contributions, ajoutez vos changements dans la section `[Non publié]` :

```markdown
## [Non publié]

### ✨ Ajouté
- Votre nouvelle fonctionnalité (#123)

### 🐛 Corrigé
- Description du bug corrigé (#124)
```

Les mainteneurs déplaceront ces entrées dans une nouvelle version lors de la release.

---

**Dernière mise à jour** : Février 2026
