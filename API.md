# 📡 Documentation API - Patrimoine Immo

## Vue d'ensemble

L'API REST de Patrimoine Immo expose des endpoints pour gérer les biens immobiliers, locataires, loyers, quittances et abonnements.

**Base URL** : `https://votre-app.vercel.app/api`

**Authentification** : Session cookie via Supabase Auth (automatique dans le navigateur)

**Format des données** : JSON (sauf pour les exports de fichiers)

## Table des matières

- [Authentification](#-authentification)
- [Profil Utilisateur](#-profil-utilisateur)
- [Biens](#-biens)
- [Locataires](#-locataires)
- [Loyers](#-loyers)
- [Quittances](#-quittances)
- [Export](#-export)
- [Import](#-import)
- [Paiements Stripe](#-paiements-stripe)
- [Backup](#-backup)
- [Codes d'erreur](#-codes-derreur)
- [Tester l'API](#-tester-lapi)

---

## 🔐 Authentification

### POST /api/auth/signup

Créer un nouveau compte utilisateur avec email et mot de passe.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse (200)** :
```json
{
  "success": true,
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Email et mot de passe requis` | Champs manquants |
| `400` | `Format d'email invalide` | Email mal formaté |
| `400` | `Le mot de passe doit contenir au moins 8 caractères` | Mot de passe trop court |
| `400` | `Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre` | Complexité insuffisante |
| `500` | `Erreur lors de l'inscription` | Erreur Supabase |

**Exemple cURL** :
```bash
curl -X POST https://votre-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

### POST /api/auth/validate-password

Valider un mot de passe sans créer de compte (utile pour la validation en temps réel).

**Body** :
```json
{
  "password": "test123"
}
```

**Réponse (200) - Mot de passe valide** :
```json
{
  "valid": true
}
```

**Réponse (400) - Mot de passe invalide** :
```json
{
  "valid": false,
  "error": "Le mot de passe doit contenir au moins 8 caractères"
}
```

**Règles de validation** :
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Pas de mots de passe communs (`password`, `12345678`, `azerty123`)

---

### POST /api/auth/send-otp

Envoyer un code OTP par email pour la connexion.

**Body** :
```json
{
  "email": "user@example.com",
  "type": "login"
}
```

**Réponse (200)** :
```json
{
  "success": true,
  "remaining": 2
}
```

> `remaining` : Nombre de tentatives restantes avant rate limit

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Email et type requis` | Champs manquants |
| `400` | `Format d'email invalide` | Email mal formaté |
| `429` | `Trop de tentatives. Réessayez dans X minute(s).` | Rate limit dépassé |
| `500` | `Erreur lors de l'envoi du code` | Erreur Supabase |

**Rate Limiting** : 3 tentatives par 15 minutes par email

---

## 👤 Profil Utilisateur

### GET /api/user/profile

Récupérer le profil de l'utilisateur connecté.

**Headers** :
- Session cookie Supabase (automatique dans le navigateur)

**Réponse (200)** :
```json
{
  "profile": {
    "id": "uuid-user-id",
    "userId": "uuid-user-id",
    "email": "user@example.com",
    "name": "Jean Dupont",
    "plan": "essentiel",
    "currency": "EUR",
    "rentPaymentDay": 5,
    "paymentDelayDays": 5,
    "emailAlertsEnabled": true,
    "appNotificationsEnabled": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `500` | `Erreur serveur` | Erreur base de données |

---

## 🏠 Biens

### GET /api/biens/[id]

Récupérer un bien immobilier par son ID.

**Paramètres URL** :
- `id` : UUID du bien

**Réponse (200)** :
```json
{
  "bien": {
    "id": "uuid-bien-id",
    "userId": "uuid-user-id",
    "nom": "Appartement Paris 11",
    "adresse": "10 rue de la Paix",
    "ville": "Paris",
    "codePostal": "75011",
    "typeFinancement": "CREDIT",
    "loyerMensuel": 1200,
    "chargesMensuelles": 150,
    "taxeFonciere": 800,
    "chargesCopro": 50,
    "assurance": 30,
    "fraisGestion": 50,
    "autresCharges": 20,
    "montantCredit": 200000,
    "tauxCredit": 3.5,
    "dureeCredit": 240,
    "mensualiteCredit": 1150,
    "dateDebutCredit": "2023-01-15",
    "capitalRestantDu": 180000,
    "prixAchat": 220000,
    "fraisNotaire": 15000,
    "travauxInitiaux": 10000,
    "autresFrais": 2000,
    "dateAcquisition": "2023-01-01",
    "dateMiseEnLocation": "2023-03-01",
    "enrichissementFinancement": true,
    "enrichissementInvestissement": true,
    "enrichissementHistorique": false,
    "enrichissementRentabilite": false,
    "enrichissementCharges": true,
    "enrichissementLocataire": true,
    "enrichissementDepenses": false,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide ou bien supprimé |

---

### PUT /api/biens/[id]

Mettre à jour un bien immobilier.

**Paramètres URL** :
- `id` : UUID du bien

**Body** (partiel - seuls les champs à modifier) :
```json
{
  "nom": "Nouveau nom",
  "loyerMensuel": 1300,
  "enrichissementCharges": true
}
```

**Champs modifiables** :
- `nom`, `adresse`, `ville`, `codePostal`
- `typeFinancement` (`CREDIT` ou `CASH`)
- `loyerMensuel`, `chargesMensuelles`
- `taxeFonciere`, `chargesCopro`, `assurance`, `fraisGestion`, `autresCharges`
- `montantCredit`, `tauxCredit`, `dureeCredit`, `mensualiteCredit`, `dateDebutCredit`, `capitalRestantDu`
- `prixAchat`, `fraisNotaire`, `travauxInitiaux`, `autresFrais`
- `dateAcquisition`, `dateMiseEnLocation`
- `revenusAnterieursOverride`, `chargesAnterieuresOverride`
- `enrichissementFinancement`, `enrichissementInvestissement`, `enrichissementHistorique`, `enrichissementRentabilite`, `enrichissementCharges`, `enrichissementLocataire`, `enrichissementDepenses`

**Réponse (200)** :
```json
{
  "success": true
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide ou bien supprimé |

---

## 👥 Locataires

### GET /api/biens/[id]/locataire

Récupérer le locataire d'un bien.

**Paramètres URL** :
- `id` : UUID du bien

**Réponse (200) - Avec locataire** :
```json
{
  "locataire": {
    "id": "uuid-locataire-id",
    "bienId": "uuid-bien-id",
    "nom": "Martin",
    "prenom": "Jean",
    "email": "jean.martin@example.com",
    "telephone": "0601020304",
    "dateEntree": "2023-03-01",
    "montantAPL": 200,
    "modePaiement": "virement",
    "createdAt": "2023-03-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Réponse (200) - Sans locataire** :
```json
{
  "locataire": null
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide |

---

### PUT /api/biens/[id]/locataire

Créer ou mettre à jour le locataire d'un bien.

**Paramètres URL** :
- `id` : UUID du bien

**Body** :
```json
{
  "nom": "Martin",
  "prenom": "Jean",
  "email": "jean.martin@example.com",
  "telephone": "0601020304",
  "dateEntree": "2023-03-01",
  "montantAPL": 200,
  "modePaiement": "virement"
}
```

**Champs obligatoires** : `nom`, `prenom`

**Modes de paiement valides** : `virement`, `cheque`, `especes`, `prelevement`

**Réponse (200)** :
```json
{
  "success": true
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Le nom et le prénom sont obligatoires` | Champs manquants |
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide |

---

## 💰 Loyers

### GET /api/biens/[id]/loyers

Récupérer tous les loyers d'un bien pour l'année en cours.

**Paramètres URL** :
- `id` : UUID du bien

**Réponse (200)** :
```json
{
  "loyers": [
    {
      "id": "uuid-loyer-id",
      "bienId": "uuid-bien-id",
      "annee": 2024,
      "mois": 0,
      "montantLocataire": 1000,
      "montantAPL": 200,
      "payeLocataire": true,
      "payeAPL": true,
      "datePaiementLocataire": "2024-01-05T00:00:00Z",
      "datePaiementAPL": "2024-01-10T00:00:00Z",
      "createdAt": "2024-01-05T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z"
    },
    {
      "id": "uuid-loyer-id-2",
      "bienId": "uuid-bien-id",
      "annee": 2024,
      "mois": 1,
      "montantLocataire": 1000,
      "montantAPL": 200,
      "payeLocataire": false,
      "payeAPL": false,
      "datePaiementLocataire": null,
      "datePaiementAPL": null
    }
  ]
}
```

> **Note** : `mois` est indexé de 0 à 11 (0 = Janvier, 11 = Décembre)

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide |

---

## 📄 Quittances

### GET /api/biens/[id]/quittances

Récupérer toutes les quittances générées pour un bien.

**Paramètres URL** :
- `id` : UUID du bien

**Réponse (200)** :
```json
{
  "quittances": [
    {
      "id": "uuid-quittance-id",
      "userId": "uuid-user-id",
      "bienId": "uuid-bien-id",
      "mois": 1,
      "annee": 2024,
      "locataireNom": "Martin",
      "locatairePrenom": "Jean",
      "locataireEmail": "jean.martin@example.com",
      "montantLocataire": 1000,
      "montantAPL": 200,
      "montantTotal": 1200,
      "datePayeLocataire": "2024-01-05",
      "datePayeAPL": "2024-01-10",
      "modePaiement": "virement",
      "emailEnvoye": true,
      "dateEnvoiEmail": "2024-01-05T10:00:00Z",
      "pdfUrl": null,
      "createdAt": "2024-01-05T10:00:00Z",
      "updatedAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

---

### POST /api/biens/[id]/quittances

Créer une nouvelle quittance.

**Paramètres URL** :
- `id` : UUID du bien

**Body** :
```json
{
  "mois": 1,
  "annee": 2024,
  "locataireNom": "Martin",
  "locatairePrenom": "Jean",
  "locataireEmail": "jean.martin@example.com",
  "montantLocataire": 1000,
  "montantAPL": 200,
  "datePayeLocataire": "2024-01-05",
  "datePayeAPL": "2024-01-10",
  "modePaiement": "virement",
  "emailEnvoye": false
}
```

**Champs obligatoires** :
- `mois` (1-12)
- `annee` (2000-2100)
- `locataireNom`, `locatairePrenom`
- `montantLocataire` (≥ 0)
- `datePayeLocataire` (format: `YYYY-MM-DD`)
- `modePaiement` (`virement`, `cheque`, `especes`, `prelevement`)

**Réponse (200)** :
```json
{
  "quittance": {
    "id": "uuid-quittance-id",
    "bienId": "uuid-bien-id",
    "mois": 1,
    "annee": 2024,
    "montantTotal": 1200,
    "createdAt": "2024-01-05T10:00:00Z"
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Données obligatoires manquantes` | Champs requis absents |
| `400` | `Le mois doit être entre 1 et 12` | Mois invalide |
| `400` | `L'année doit être entre 2000 et 2100` | Année invalide |
| `400` | `Les montants doivent être positifs` | Montant négatif |
| `400` | `Format de date invalide (attendu: YYYY-MM-DD)` | Date mal formatée |
| `400` | `Mode de paiement invalide` | Mode non reconnu |
| `409` | `Une quittance existe déjà pour ce mois` | Doublon |

---

### POST /api/send-quittance

Envoyer une quittance par email au locataire.

**Body** :
```json
{
  "pdfBase64": "JVBERi0xLjQKJeLjz9...",
  "bienId": "uuid-bien-id",
  "locataireEmail": "jean.martin@example.com",
  "locataireNom": "Martin",
  "locatairePrenom": "Jean",
  "mois": 1,
  "annee": 2024,
  "bienNom": "Appartement Paris 11",
  "montantLocataire": 1000,
  "montantAPL": 200,
  "datePayeLocataire": "2024-01-05",
  "datePayeAPL": "2024-01-10",
  "modePaiement": "virement"
}
```

**Champs obligatoires** :
- `pdfBase64` : PDF en base64 (max 10MB)
- `bienId` : UUID du bien
- `locataireEmail` : Email valide (max 254 caractères)
- `locataireNom`, `locatairePrenom` (max 100 caractères chacun)

**Réponse (200)** :
```json
{
  "success": true,
  "data": {
    "id": "resend-email-id"
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `PDF, email et bienId requis` | Champs manquants |
| `400` | `Format email invalide` | Email mal formaté |
| `400` | `PDF trop volumineux (max 7.5MB)` | Fichier trop gros |
| `401` | `Non authentifié` | Pas de session active |
| `403` | `Accès non autorisé` | Le bien ne vous appartient pas |
| `404` | `Bien introuvable` | ID invalide |
| `500` | `Service email non configuré` | Clé Resend manquante |

---

## 📊 Export

### GET /api/export/excel

Exporter tous les biens de l'utilisateur au format Excel.

**Réponse (200)** :
- **Content-Type** : `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition** : `attachment; filename="Patrimoine_Immo_2024-01-15.xlsx"`
- **Body** : Fichier binaire Excel

**Colonnes du fichier** :
- Nom, Type Financement, Adresse, Code Postal, Ville
- Prix d'achat, Frais de notaire, Travaux initiaux, Autres frais, Investissement total
- Montant crédit, Taux crédit, Durée crédit, Mensualité, Capital restant dû
- Loyer mensuel
- Taxe foncière, Charges copro, Assurance, Frais gestion, Autres charges, Charges totales
- Rentabilité brute (%), Rentabilité nette (%), Cash-flow mensuel
- Dates (acquisition, location, crédit)
- Statuts enrichissement

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `404` | `Aucun bien à exporter` | Pas de biens créés |

---

### GET /api/export/pdf

Exporter un rapport annuel au format PDF.

**Réponse (200)** :
- **Content-Type** : `application/pdf`
- **Content-Disposition** : `attachment; filename="Rapport_Annuel_2024_2024-01-15.pdf"`
- **Body** : Fichier binaire PDF

**Contenu du rapport** :
- Récapitulatif du patrimoine
- Liste des biens avec leurs caractéristiques
- Statistiques globales (patrimoine total, loyers annuels, cash-flow)
- Graphiques de rentabilité

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `404` | `Aucun bien à exporter` | Pas de biens créés |

---

## 📥 Import

### POST /api/import/csv

Importer des biens depuis un fichier CSV.

**Content-Type** : `multipart/form-data`

**Body** :
- `file` : Fichier CSV (max 5MB, max 50 biens)

**Format CSV attendu** :
```csv
nom,adresse,codepostal,ville,typefinancement,prixachat,loyermensuel,taxefonciere
Appt Paris,10 rue X,75001,Paris,credit,250000,1200,800
Studio Lyon,5 rue Y,69001,Lyon,comptant,80000,500,200
```

**Colonnes supportées** (headers normalisés automatiquement) :
- `nom` ✅ **Obligatoire**
- `adresse`, `codepostal`, `ville`
- `typefinancement` (`credit`, `crédit`, `emprunt` → CREDIT / autre → COMPTANT)
- `prixachat`, `fraisnotaire`, `travauxinitiaux`, `autresfrais`
- `montantcredit`, `tauxcredit`, `dureecredit`, `mensualitecredit`
- `loyermensuel`
- `taxefonciere`, `chargescopro`, `assurance`, `fraisgestion`, `autrescharges`
- `dateacquisition`, `datemiseenlocation`, `datedebutcredit`

**Formats de date acceptés** :
- `YYYY-MM-DD` (ex: `2024-01-15`)
- `DD/MM/YYYY` (ex: `15/01/2024`)
- `DD-MM-YYYY` (ex: `15-01-2024`)

**Réponse (200)** :
```json
{
  "success": true,
  "imported": 5,
  "biens": ["Appt Paris", "Studio Lyon", "Maison Bordeaux", "T2 Lille", "Loft Marseille"],
  "warnings": [
    {
      "row": 3,
      "field": "prixAchat",
      "error": "Valeur numérique invalide: abc"
    }
  ]
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Aucun fichier fourni` | Fichier manquant |
| `400` | `Le fichier doit être au format CSV` | Mauvaise extension |
| `400` | `Le fichier est trop volumineux (max 5MB)` | Trop gros |
| `400` | `Le fichier CSV est vide` | Aucune donnée |
| `400` | `Maximum 50 biens par import` | Trop de lignes |
| `400` | `Limite du plan atteinte` | Plan insuffisant |
| `400` | `Aucun bien valide trouvé` | Tous sans nom |
| `401` | `Non authentifié` | Pas de session active |

---

## 💳 Paiements Stripe

### POST /api/create-checkout

Créer une session de paiement Stripe Checkout.

**Body** :
```json
{
  "priceId": "price_1234567890abcdef",
  "userId": "uuid-user-id"
}
```

**Réponse (200)** :
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

> L'utilisateur doit être redirigé vers cette URL pour effectuer le paiement.

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | `Price ID et User ID requis` | Champs manquants |
| `500` | Erreur Stripe | Problème avec Stripe |

---

### POST /api/webhooks/stripe

Webhook Stripe pour recevoir les événements de paiement.

> ⚠️ **Usage interne uniquement** - Ne pas appeler directement

**Headers requis** :
- `stripe-signature` : Signature de vérification Stripe

**Événements gérés** :

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Met à jour le plan utilisateur après paiement réussi |
| `customer.subscription.updated` | Met à jour le plan si changement d'abonnement |
| `customer.subscription.deleted` | Rétrograde vers plan "découverte" |

**Réponse (200)** :
```json
{
  "received": true
}
```

---

## 💾 Backup

### GET /api/backup

Télécharger une sauvegarde complète de toutes les données utilisateur.

**Réponse (200)** :
- **Content-Type** : `application/json`
- **Content-Disposition** : `attachment; filename="Backup_Patrimoine_Immo_2024-01-15.json"`

**Structure du fichier** :
```json
{
  "_metadata": {
    "version": "1.0",
    "application": "Patrimoine Immo",
    "createdAt": "2024-01-15T10:00:00Z",
    "format": "json"
  },
  "user": {
    "id": "uuid-user-id",
    "email": "user@example.com",
    "profile": {
      "name": "Jean Dupont",
      "plan": "essentiel",
      "currency": "EUR"
    }
  },
  "data": {
    "biens": [...],
    "quittances": [...],
    "loyers": [...],
    "locataires": [...],
    "investissementsSecondaires": [...]
  },
  "statistics": {
    "totalBiens": 5,
    "totalQuittances": 24,
    "totalLoyers": 60,
    "totalLocataires": 5,
    "totalInvestissementsSecondaires": 3,
    "patrimoineTotal": 750000,
    "loyersMensuelsTotal": 4500
  }
}
```

**Erreurs** :

| Code | Erreur | Description |
|------|--------|-------------|
| `401` | `Non authentifié` | Pas de session active |
| `500` | `Erreur lors de la création du backup` | Erreur base de données |

---

## ❌ Codes d'erreur

### Codes HTTP

| Code | Signification | Quand |
|------|---------------|-------|
| `200` | Succès | Requête traitée avec succès |
| `201` | Créé | Ressource créée avec succès |
| `400` | Bad Request | Données invalides ou manquantes |
| `401` | Unauthorized | Authentification requise |
| `403` | Forbidden | Accès refusé (pas propriétaire) |
| `404` | Not Found | Ressource introuvable |
| `409` | Conflict | Doublon (quittance déjà existante) |
| `429` | Too Many Requests | Rate limit dépassé |
| `500` | Internal Server Error | Erreur serveur |

### Format des erreurs

Toutes les erreurs retournent un JSON avec ce format :
```json
{
  "error": "Message d'erreur lisible"
}
```

Certaines erreurs incluent des détails supplémentaires :
```json
{
  "error": "Erreur lors de la lecture du CSV",
  "details": [
    { "row": 2, "message": "Valeur manquante" }
  ]
}
```

---

## 🧪 Tester l'API

### Avec cURL

```bash
# 1. Inscription
curl -X POST https://votre-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt

# 2. Envoyer OTP pour connexion
curl -X POST https://votre-app.vercel.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"login"}'

# 3. Récupérer le profil (avec cookies de session)
curl https://votre-app.vercel.app/api/user/profile \
  -b cookies.txt

# 4. Exporter les biens en Excel
curl https://votre-app.vercel.app/api/export/excel \
  -b cookies.txt \
  -o patrimoine.xlsx

# 5. Créer un backup
curl https://votre-app.vercel.app/api/backup \
  -b cookies.txt \
  -o backup.json
```

### Avec Postman

1. **Créer une collection** "Patrimoine Immo API"
2. **Configurer l'environnement** :
   - `baseUrl` : `https://votre-app.vercel.app/api`
3. **Récupérer le cookie de session** après login via l'interface web
4. **Ajouter le cookie** dans les headers des requêtes

### Avec l'interface web

La façon la plus simple de tester l'API est d'utiliser l'interface web de l'application, qui appelle automatiquement les endpoints avec l'authentification correcte.

---

## 🔒 Sécurité

### Authentification

- Toutes les routes (sauf `/api/auth/*` et `/api/webhooks/stripe`) nécessitent une session active
- Les sessions sont gérées par Supabase Auth via cookies sécurisés
- Chaque requête vérifie que l'utilisateur est propriétaire de la ressource

### Vérification de propriété

```typescript
// Exemple de vérification dans chaque route
const bien = await getBien(id, supabase)
if (bien.userId !== user.id) {
  return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
}
```

### Rate Limiting

| Route | Limite |
|-------|--------|
| `/api/auth/send-otp` | 3 requêtes / 15 min par email |

### Validation des données

- Email : regex de validation
- Mot de passe : 8 caractères minimum, majuscule + minuscule + chiffre
- Fichiers : taille max (CSV: 5MB, PDF: 10MB)
- Textes : longueur max (nom: 100, adresse: 200)

### Webhooks Stripe

- Vérification de la signature `stripe-signature`
- Clé secrète `STRIPE_WEBHOOK_SECRET`

---

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Documentation Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Documentation Resend](https://resend.com/docs)

---

**Dernière mise à jour** : Février 2026  
**Version API** : 1.0
