# Migration Multi-Locataires & Multi-Lots

**Date :** 11 février 2026  
**Statut :** ✅ Terminée

## Résumé

Migration complète de l'application pour supporter plusieurs locataires par bien et plusieurs lots par bien.

## Changements BDD

### Nouvelles tables
- `lots` : Contient les lots d'un bien (Principal par défaut, ou N lots)
  - Colonnes : id, bien_id, user_id, numero_lot, superficie, loyer_mensuel, est_lot_defaut
  - Relations : bien_id → biens(id), user_id → auth.users(id)

### Tables modifiées
- `locataires` : Ajout colonne `lot_id`, suppression contrainte UNIQUE sur `bien_id`
  - Permet plusieurs locataires par bien (via différents lots)
  
- `loyers` : Ajout colonne `locataire_id`
  - Contrainte UNIQUE modifiée : (bien_id, locataire_id, annee, mois)
  - Permet un loyer par locataire par mois
  
- `quittances` : Ajout colonne `locataire_id`
  - Contrainte UNIQUE modifiée : (bien_id, locataire_id, mois, annee)
  - Permet une quittance par locataire par mois

## Changements fonctions

### lib/database.ts - Nouvelles fonctions
- `getLots(bienId)` : Récupère tous les lots d'un bien
- `createLot(data)` : Crée un nouveau lot (avec param optionnel `estLotDefaut`)
- `deleteLot(lotId)` : Supprime un lot (sauf lot par défaut)
- `getLocataires(bienId)` : Récupère tous les locataires (pluriel)
- `getLocatairesByLot(lotId)` : Récupère les locataires d'un lot
- `deleteLocataire(locataireId)` : Supprime un locataire

### lib/database.ts - Fonctions modifiées
- `upsertLocataire(bienId, lotId, data)` : Paramètre lotId ajouté
- `upsertLoyer(...)` : Support locataireId
- `createQuittance(...)` : Support locataireId

### lib/database.ts - Fonctions supprimées
- `getLocataire()` : Remplacée par `getLocataires()` (pluriel)

## Changements UI

### Nouveaux composants
- `LocatairesList.tsx` : Gestion multi-locataires
  - Liste de tous les locataires
  - Ajout/modification/suppression
  - KPIs agrégés (loyer total, APL total, reste à charge)

### Composants modifiés
- `BienFormDialog.tsx` : Checkbox "Plusieurs lots" + formulaire lots dynamique
- `Loyers.tsx` : Calculs agrégés multi-locataires
- `CalendrierPaiements.tsx` : Affichage N lignes par mois (une par locataire)
- `BienDetailClient.tsx` : Onglet "Locataire" → "Locataires"
- `QuittanceModal.tsx` : Références textuelles mises à jour

### Composants supprimés
- `Locataire.tsx` : Remplacé par `LocatairesList.tsx`

## API Routes modifiées
- `app/api/biens/[id]/locataire/route.ts` :
  - GET : retourne `{ locataire, locataires }` (rétrocompatible)
  - PUT : récupère le lot par défaut avant upsertLocataire

## Migration des données existantes

### Script 1 : create-lots-table.sql
- Création table lots
- Migration automatique : 1 lot "Principal" par bien existant
- loyer_mensuel copié depuis bien.loyerMensuel

### Script 2 : migrate-locataires-add-lot.sql
- Ajout colonne lot_id
- Migration locataires vers leur lot par défaut
- Suppression contrainte UNIQUE sur bien_id

### Script 3 : migrate-loyers-quittances-add-locataire.sql
- Ajout locataire_id dans loyers et quittances
- Modification contraintes UNIQUE

## Comportement

### Création d'un bien

**Mode simple** (default) :
1. Bien créé avec loyerMensuel
2. Lot "Principal" créé automatiquement (estLotDefaut: true)
3. Loyer du lot = loyer du bien

**Mode multi-lots** (checkbox cochée) :
1. Bien créé avec loyerMensuel = somme des lots
2. N lots créés (le 1er est le lot par défaut)
3. Chaque lot a son propre loyer

### Gestion des locataires

- Liste de tous les locataires du bien
- Ajout : formulaire inline → crée dans le lot par défaut
- Modification : édition inline
- Suppression : avec confirmation

### Gestion des loyers

- Calendrier affiche N lignes par mois (une par locataire)
- Chaque locataire a ses checkboxes paiement + APL
- Quittance individuelle par locataire
- CA agrégé sur tous les locataires

## Rétrocompatibilité

✅ **Biens existants** : Automatiquement migrés avec un lot "Principal"  
✅ **Locataires existants** : Automatiquement liés à leur lot par défaut  
✅ **Loyers existants** : Fonctionnent en mode global (locataire_id NULL)  
✅ **Quittances existantes** : Fonctionnent en mode global (locataire_id NULL)  
✅ **UI** : Si 1 seul locataire, affichage simple (pas de badge nom)  
✅ **API** : GET /locataire retourne toujours `locataire` (premier) + `locataires` (tous)

## Tests

- ✅ 268 tests passent (16 fichiers)
- ✅ Build TypeScript OK (Next.js 16.1.3 Turbopack)
- ✅ Lint : 0 erreurs, 47 warnings (aucun lié à la migration)

## TODO Futur

- [ ] Composant dédié pour gérer les lots (ajout/modification/suppression après création)
- [ ] Migration automatique des loyers existants vers locataire_id
- [ ] Dashboard avec stats par lot
- [ ] Export Excel avec détail par locataire
