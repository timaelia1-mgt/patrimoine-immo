# 🔍 AUDIT COMPLET DES FLOWS DE DONNÉES

## 1. CARTOGRAPHIE DES FORMULAIRES

### 1.1 Création de bien (`BienFormDialog.tsx`)
**Fichier** : `components/biens/BienFormDialog.tsx`  
**Fonction de sauvegarde** : `createBien(userId, data)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `nom` (obligatoire)
- `adresse` (obligatoire)
- `ville` (obligatoire)
- `codePostal` (obligatoire)
- `loyerMensuel` (obligatoire)
- `taxeFonciere` (optionnel)
- `chargesCopro` (optionnel)
- `assurance` (optionnel)
- `fraisGestion` (optionnel)
- `autresCharges` (optionnel)
- `typeFinancement` (CREDIT ou CASH)
- `dateDebutCredit` (si CREDIT)
- `montantCredit` (si CREDIT, obligatoire)
- `tauxCredit` (si CREDIT, obligatoire)
- `dureeCredit` (si CREDIT, obligatoire)

---

### 1.2 Modification charges (`Charges.tsx`)
**Fichier** : `components/biens/Charges.tsx`  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `taxeFonciere`
- `chargesCopro`
- `assurance`
- `fraisGestion`
- `autresCharges`

---

### 1.3 Modification financement (`Financement.tsx`)
**Fichier** : `components/biens/Financement.tsx`  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `mensualiteCredit`
- `montantCredit`
- `tauxCredit`
- `dureeCredit`

---

### 1.4 Enrichissement Financement (`FinancementForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (FinancementForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `dateDebutCredit`
- `montantCredit`
- `tauxCredit`
- `dureeCredit`
- `mensualiteCredit` (calculé automatiquement)
- `capitalRestantDu` (calculé automatiquement)

**Champs sauvegardés** :
- `enrichissementFinancement: true`
- `dateDebutCredit`
- `montantCredit`
- `tauxCredit`
- `dureeCredit`
- `mensualiteCredit`
- `capitalRestantDu`

---

### 1.5 Enrichissement Investissement (`InvestissementForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (InvestissementForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `prixAchat`
- `fraisNotaire`
- `travauxInitiaux`
- `autresFrais`

**Champs sauvegardés** :
- `enrichissementInvestissement: true`
- `prixAchat`
- `fraisNotaire`
- `travauxInitiaux`
- `autresFrais`

---

### 1.6 Enrichissement Historique (`HistoriqueForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (HistoriqueForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `dateAcquisition`
- `dateMiseEnLocation`

**Champs sauvegardés** :
- `enrichissementHistorique: true`
- `dateAcquisition`
- `dateMiseEnLocation`

---

### 1.7 Enrichissement Charges (`ChargesForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (ChargesForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `taxeFonciere`
- `chargesCopro`
- `assurance`
- `fraisGestion`
- `autresCharges`

**Champs sauvegardés** :
- `enrichissementCharges: true`
- `taxeFonciere`
- `chargesCopro`
- `assurance`
- `fraisGestion`
- `autresCharges`
- `chargesMensuelles` (total calculé)

---

### 1.8 Enrichissement Rentabilité (`RentabiliteForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (RentabiliteForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens`

**Champs du formulaire** :
- `revenusAnterieursOverride` (optionnel)
- `chargesAnterieuresOverride` (optionnel)

**Champs sauvegardés** :
- `enrichissementRentabilite: true`
- `revenusAnterieursOverride`
- `chargesAnterieuresOverride`

---

### 1.9 Enrichissement Locataire (`LocataireForm.tsx`)
**Fichier** : `components/biens/EnrichissementForms.tsx` (LocataireForm)  
**Fonction de sauvegarde** : `updateBien(bienId, updates)`  
**Table impactée** : `biens` (seulement le flag)

**Champs du formulaire** :
- `nomLocataire`
- `prenomLocataire`
- `emailLocataire`
- `telephoneLocataire`
- `dateEntree`
- `montantAPL`
- `modePaiement`

**Champs sauvegardés** :
- `enrichissementLocataire: true` **SEULEMENT**
- ❌ **AUCUNE donnée locataire n'est sauvegardée !**

---

### 1.10 Modification Locataire (`Locataire.tsx`)
**Fichier** : `components/biens/Locataire.tsx`  
**Fonction de sauvegarde** : `upsertLocataire(bienId, locataireData)`  
**Table impactée** : `locataires`

**Champs du formulaire** :
- `nom`
- `prenom`
- `email`
- `telephone`
- `dateEntree`
- `montantAPL`
- `modePaiement`

**Champs sauvegardés** :
- Tous les champs sont sauvegardés correctement dans la table `locataires`

---

### 1.11 Paramètres utilisateur (`ParametresClient.tsx`)
**Fichier** : `components/parametres/ParametresClient.tsx`  
**Fonction de sauvegarde** : `updateUserProfile(userId, updates)`  
**Table impactée** : `profiles`

**Champs du formulaire** :
- `nom` (name)
- `email` (lecture seule)
- `devise` (currency)
- `jourPaiement` (rent_payment_day)
- `delaiPaiement` (payment_delay_days)
- `alertesEmail` (email_alerts_enabled)
- `alertesNotification` (app_notifications_enabled)

**Champs sauvegardés** :
- `name` **SEULEMENT**
- ❌ **Tous les autres champs ne sont PAS sauvegardés !**

---

### 1.12 Changement mot de passe (`ParametresClient.tsx`)
**Fichier** : `components/parametres/ParametresClient.tsx`  
**Fonction de sauvegarde** : `supabase.auth.updateUser({ password })`  
**Table impactée** : `auth.users` (Supabase Auth)

**Champs du formulaire** :
- `newPassword`
- `confirmPassword`

**Fonctionnement** : ✅ Correct (pas de problème détecté)

---

## 2. SCHÉMAS BASE DE DONNÉES

### 2.1 Table `profiles`
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  plan_type TEXT DEFAULT 'decouverte',
  currency TEXT DEFAULT 'EUR',
  rent_payment_day INTEGER DEFAULT 5,
  payment_delay_days INTEGER DEFAULT 5,
  email_alerts_enabled BOOLEAN DEFAULT true,
  app_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Table `biens`
```sql
CREATE TABLE biens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  type_financement TEXT NOT NULL, -- 'credit' ou 'comptant'
  montant_credit NUMERIC,
  taux_credit NUMERIC,
  duree_credit INTEGER,
  mensualite_credit NUMERIC,
  date_debut_credit TIMESTAMPTZ,
  capital_restant_du NUMERIC,
  prix_achat NUMERIC,
  frais_notaire NUMERIC,
  travaux_initiaux NUMERIC,
  autres_frais NUMERIC,
  loyer_mensuel NUMERIC NOT NULL,
  charges_mensuelles NUMERIC DEFAULT 0,
  taxe_fonciere NUMERIC DEFAULT 0,
  charges_copro NUMERIC DEFAULT 0,
  assurance NUMERIC DEFAULT 0,
  frais_gestion NUMERIC DEFAULT 0,
  autres_charges NUMERIC DEFAULT 0,
  enrichissement_financement BOOLEAN DEFAULT false,
  enrichissement_investissement BOOLEAN DEFAULT false,
  enrichissement_historique BOOLEAN DEFAULT false,
  enrichissement_rentabilite BOOLEAN DEFAULT false,
  enrichissement_charges BOOLEAN DEFAULT false,
  enrichissement_locataire BOOLEAN DEFAULT false,
  enrichissement_depenses BOOLEAN DEFAULT false,
  date_acquisition TIMESTAMPTZ,
  date_mise_en_location TIMESTAMPTZ,
  revenus_anterieurs_override NUMERIC,
  charges_anterieures_override NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Table `locataires`
```sql
CREATE TABLE locataires (
  id TEXT PRIMARY KEY,
  bien_id TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  date_entree TIMESTAMPTZ,
  montant_apl NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  mode_paiement TEXT DEFAULT 'virement' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE
);
```

### 2.4 Table `loyers`
```sql
CREATE TABLE loyers (
  id TEXT PRIMARY KEY,
  bien_id TEXT NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois >= 0 AND mois <= 11),
  montant_locataire NUMERIC(10, 2) NOT NULL,
  montant_apl NUMERIC(10, 2) NOT NULL,
  paye_locataire BOOLEAN DEFAULT false NOT NULL,
  paye_apl BOOLEAN DEFAULT false NOT NULL,
  date_paiement_locataire TIMESTAMPTZ,
  date_paiement_apl TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
  UNIQUE (bien_id, annee, mois)
);
```

---

## 3. FONCTIONS DE SAUVEGARDE

### 3.1 `createBien(userId, bien)`
**Fichier** : `lib/database.ts` (lignes 97-133)

**Code** :
```typescript
export async function createBien(userId: string, bien: Partial<Bien>): Promise<Bien> {
  const typeFinancement = bien.typeFinancement === "CREDIT" ? "credit" : "comptant"

  const bienData: any = {
    user_id: userId,
    nom: bien.nom || "",
    adresse: bien.adresse || "",
    ville: bien.ville || "",
    code_postal: bien.codePostal || "",
    prix_achat: bien.prixAchat ? parseFloat(bien.prixAchat.toString()) : 0,
    frais_notaire: bien.fraisNotaire ? parseFloat(bien.fraisNotaire.toString()) : 0,
    travaux_initiaux: bien.travauxInitiaux ? parseFloat(bien.travauxInitiaux.toString()) : 0,
    type_financement: typeFinancement,
    montant_credit: bien.montantCredit ? parseFloat(bien.montantCredit.toString()) : null,
    taux_credit: bien.tauxCredit ? parseFloat(bien.tauxCredit.toString()) : null,
    duree_credit: bien.dureeCredit ? parseInt(bien.dureeCredit.toString()) : null,
    mensualite_credit: bien.mensualiteCredit ? parseFloat(bien.mensualiteCredit.toString()) : null,
    apport: 0,
    loyer_mensuel: bien.loyerMensuel ? parseFloat(bien.loyerMensuel.toString()) : 0,
    charges_mensuelles: bien.chargesMensuelles ? parseFloat(bien.chargesMensuelles.toString()) : 0,
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("biens")
    .insert(bienData)
    .select()
    .single()

  if (error) {
    console.error("Erreur createBien:", error)
    throw error
  }

  return convertBienFromSupabase(data)
}
```

**Champs sauvegardés** :
- ✅ `user_id`, `nom`, `adresse`, `ville`, `code_postal`
- ✅ `type_financement`, `montant_credit`, `taux_credit`, `duree_credit`, `mensualite_credit`
- ✅ `prix_achat`, `frais_notaire`, `travaux_initiaux` (mais pas utilisés à la création)
- ✅ `loyer_mensuel`, `charges_mensuelles`
- ❌ **MANQUANT** : `taxe_fonciere`, `charges_copro`, `assurance`, `frais_gestion`, `autres_charges`
- ❌ **MANQUANT** : `date_debut_credit` (si fourni)

---

### 3.2 `updateBien(bienId, updates)`
**Fichier** : `lib/database.ts` (lignes 135-196)

**Code** : Convertit automatiquement camelCase → snake_case et sauvegarde tous les champs fournis.

**Mapping des champs** :
- ✅ Tous les champs sont correctement mappés
- ✅ Conversion automatique camelCase → snake_case pour les champs non mappés

---

### 3.3 `upsertLocataire(bienId, locataireData)`
**Fichier** : `lib/database.ts` (lignes 402-442)

**Code** : Sauvegarde correctement tous les champs du locataire dans la table `locataires`.

**Champs sauvegardés** :
- ✅ Tous les champs sont sauvegardés correctement

---

### 3.4 `updateUserProfile(userId, updates)`
**Fichier** : `lib/database.ts` (lignes 255-284)

**Code** : Convertit `plan` → `plan_type` et sauvegarde les autres champs.

**Champs sauvegardés** :
- ✅ `name`, `plan_type`
- ❌ **MANQUANT** : `currency`, `rent_payment_day`, `payment_delay_days`, `email_alerts_enabled`, `app_notifications_enabled`

---

## 4. INCOHÉRENCES DÉTECTÉES

### ❌ PROBLÈME 1 : Charges foncières non transmises lors création bien
**Criticité** : 🔴 **CRITIQUE** (perte de données)

**Description** :
- **Formulaire** (`BienFormDialog.tsx`) : ✅ Les champs `taxeFonciere`, `chargesCopro`, `assurance`, `fraisGestion`, `autresCharges` sont présents et remplis
- **Payload envoyé** : ✅ Les champs sont présents dans `data` (lignes 142-146)
- **Fonction `createBien`** : ❌ Les champs ne sont **PAS** sauvegardés en base (lignes 101-118)
- **Base de données** : ✅ Les colonnes `taxe_fonciere`, `charges_copro`, `assurance`, `frais_gestion`, `autres_charges` existent

**Impact** : Les charges saisies lors de la création d'un bien sont **perdues**. L'utilisateur doit les ressaisir via l'onglet Charges.

**FIX** : Ajouter dans `createBien` :
```typescript
taxe_fonciere: bien.taxeFonciere ? parseFloat(bien.taxeFonciere.toString()) : 0,
charges_copro: bien.chargesCopro ? parseFloat(bien.chargesCopro.toString()) : 0,
assurance: bien.assurance ? parseFloat(bien.assurance.toString()) : 0,
frais_gestion: bien.fraisGestion ? parseFloat(bien.fraisGestion.toString()) : 0,
autres_charges: bien.autresCharges ? parseFloat(bien.autresCharges.toString()) : 0,
```

---

### ❌ PROBLÈME 2 : Date début crédit non transmise lors création bien
**Criticité** : 🟡 **MOYEN** (UX dégradée)

**Description** :
- **Formulaire** : ✅ Le champ `dateDebutCredit` est présent (ligne 162)
- **Payload envoyé** : ✅ Le champ est présent dans `data.dateDebutCredit` (ligne 162)
- **Fonction `createBien`** : ❌ Le champ n'est **PAS** sauvegardé en base
- **Base de données** : ✅ La colonne `date_debut_credit` existe

**Impact** : La date de début du crédit saisie lors de la création est perdue.

**FIX** : Ajouter dans `createBien` :
```typescript
date_debut_credit: bien.dateDebutCredit ? new Date(bien.dateDebutCredit).toISOString() : null,
```

---

### ❌ PROBLÈME 3 : Données locataire non sauvegardées lors enrichissement
**Criticité** : 🔴 **CRITIQUE** (perte de données)

**Description** :
- **Formulaire `LocataireForm`** : ✅ Tous les champs sont présents (nom, prenom, email, telephone, dateEntree, montantAPL, modePaiement)
- **Payload envoyé** : ❌ Seulement `enrichissementLocataire: true` est envoyé (lignes 834-837)
- **Fonction `updateBien`** : ✅ Fonctionne correctement mais ne reçoit pas les données
- **Table `locataires`** : ✅ Existe et fonctionne (utilisée par `Locataire.tsx`)

**Impact** : Les données saisies dans le formulaire d'enrichissement `LocataireForm` sont **complètement perdues**. L'utilisateur doit les ressaisir via l'onglet Locataire.

**FIX** : Modifier `LocataireForm.handleSubmit` pour appeler `upsertLocataire` :
```typescript
await upsertLocataire(bienId, {
  nom: formData.nomLocataire,
  prenom: formData.prenomLocataire,
  email: formData.emailLocataire || null,
  telephone: formData.telephoneLocataire || null,
  dateEntree: formData.dateEntree || null,
  montantAPL: parseFloat(formData.montantAPL || "0"),
  modePaiement: formData.modePaiement,
})
await updateBien(bienId, {
  enrichissementLocataire: true,
})
```

---

### ❌ PROBLÈME 4 : Charges mensuelles non recalculées lors modification charges
**Criticité** : 🟡 **MOYEN** (données incohérentes)

**Description** :
- **Formulaire `Charges.tsx`** : ✅ Calcule `totalCharges` (lignes 45-50)
- **Payload envoyé** : ❌ N'envoie **PAS** `chargesMensuelles` (lignes 29-35)
- **Base de données** : ✅ La colonne `charges_mensuelles` existe

**Impact** : Le champ `charges_mensuelles` n'est pas mis à jour quand on modifie les charges individuelles, ce qui peut créer des incohérences.

**FIX** : Ajouter dans `Charges.handleSave` :
```typescript
const totalCharges = 
  parseFloat(formData.taxeFonciere) +
  parseFloat(formData.chargesCopro) +
  parseFloat(formData.assurance) +
  parseFloat(formData.fraisGestion) +
  parseFloat(formData.autresCharges)

await updateBien(bien.id, {
  taxeFonciere: parseFloat(formData.taxeFonciere),
  chargesCopro: parseFloat(formData.chargesCopro),
  assurance: parseFloat(formData.assurance),
  fraisGestion: parseFloat(formData.fraisGestion),
  autresCharges: parseFloat(formData.autresCharges),
  chargesMensuelles: totalCharges, // ← AJOUTER
})
```

---

### ❌ PROBLÈME 5 : Paramètres utilisateur non sauvegardés (sauf nom)
**Criticité** : 🟡 **MOYEN** (fonctionnalité incomplète)

**Description** :
- **Formulaire `ParametresClient.tsx`** : ✅ Tous les champs sont présents (devise, jourPaiement, delaiPaiement, alertesEmail, alertesNotification)
- **Payload envoyé** : ❌ Seulement `name` est envoyé (lignes 58-62)
- **Fonction `updateUserProfile`** : ✅ Fonctionne correctement mais ne reçoit pas les autres champs
- **Base de données** : ✅ Toutes les colonnes existent (`currency`, `rent_payment_day`, `payment_delay_days`, `email_alerts_enabled`, `app_notifications_enabled`)

**Impact** : Les paramètres de gestion des loyers et alertes ne sont pas sauvegardés, rendant cette fonctionnalité inutile.

**FIX** : Modifier `ParametresClient.handleSave` pour envoyer tous les champs :
```typescript
const result = await updateUserProfile(profile.id, {
  name: settings.nom.trim(),
  currency: settings.devise,
  rent_payment_day: parseInt(settings.jourPaiement),
  payment_delay_days: parseInt(settings.delaiPaiement),
  email_alerts_enabled: settings.alertesEmail,
  app_notifications_enabled: settings.alertesNotification,
})
```

Et modifier `updateUserProfile` pour mapper correctement :
```typescript
const fieldMapping: Record<string, string> = {
  name: "name",
  plan: "plan_type",
  currency: "currency",
  rentPaymentDay: "rent_payment_day",
  paymentDelayDays: "payment_delay_days",
  emailAlertsEnabled: "email_alerts_enabled",
  appNotificationsEnabled: "app_notifications_enabled",
}
```

---

### ⚠️ PROBLÈME 6 : Désactivation fonctionnalité ne supprime pas les données
**Criticité** : 🟢 **MINEUR** (comportement attendu mais non documenté)

**Description** :
- **Action** : Quand on désactive une fonctionnalité enrichie (ex: `enrichissementInvestissement`), le flag passe à `false` mais les données restent en base
- **Comportement actuel** : Les données sont conservées (ce qui peut être souhaitable)
- **Impact** : Pas de problème technique, mais l'utilisateur pourrait s'attendre à ce que les données soient supprimées

**Recommandation** : Documenter ce comportement ou ajouter une option "Supprimer les données" lors de la désactivation.

---

## 5. RÉSUMÉ PRIORISATION

### 🔴 **CRITIQUES** (perte de données)
1. **Problème 1** : Charges foncières non transmises lors création bien
2. **Problème 3** : Données locataire non sauvegardées lors enrichissement

### 🟡 **MOYENS** (UX dégradée / données incohérentes)
3. **Problème 2** : Date début crédit non transmise lors création bien
4. **Problème 4** : Charges mensuelles non recalculées lors modification charges
5. **Problème 5** : Paramètres utilisateur non sauvegardés (sauf nom)

### 🟢 **MINEURS** (cosmétique / comportement)
6. **Problème 6** : Désactivation fonctionnalité ne supprime pas les données (comportement attendu mais non documenté)

---

## 6. ACTIONS RECOMMANDÉES

### Priorité 1 (Immédiat)
1. ✅ Corriger `createBien` pour sauvegarder toutes les charges
2. ✅ Corriger `LocataireForm` pour sauvegarder les données locataire

### Priorité 2 (Court terme)
3. ✅ Corriger `createBien` pour sauvegarder `dateDebutCredit`
4. ✅ Corriger `Charges.handleSave` pour recalculer `chargesMensuelles`
5. ✅ Corriger `ParametresClient.handleSave` pour sauvegarder tous les paramètres

### Priorité 3 (Moyen terme)
6. ⚠️ Documenter ou améliorer le comportement de désactivation des fonctionnalités

---

## 7. VÉRIFICATIONS SUPPLÉMENTAIRES

### Points à vérifier manuellement :
- [ ] Vérifier que `chargesMensuelles` est bien calculé et sauvegardé partout où nécessaire
- [ ] Vérifier que tous les champs optionnels sont correctement gérés (null vs 0)
- [ ] Vérifier la cohérence des noms de champs entre formulaire → fonction → base (camelCase vs snake_case)
- [ ] Tester tous les formulaires d'enrichissement pour s'assurer qu'ils sauvegardent bien les données
- [ ] Vérifier que les validations côté client correspondent aux contraintes base de données

---

**Date de l'audit** : 2024  
**Version de l'application** : v1.0
