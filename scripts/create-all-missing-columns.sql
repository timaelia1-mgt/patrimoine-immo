-- =====================================================
-- SCRIPT SQL COMPLET : Création de TOUTES les colonnes manquantes
-- Table: biens
-- =====================================================
-- Ce script ajoute TOUTES les colonnes utilisées par l'application
-- Utilise IF NOT EXISTS pour éviter les erreurs si une colonne existe déjà
-- 
-- EXÉCUTER CE SCRIPT DANS L'ÉDITEUR SQL DE SUPABASE
-- =====================================================

-- =====================================================
-- 1. COLONNES D'INVESTISSEMENT
-- =====================================================
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS prix_achat NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS frais_notaire NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS travaux_initiaux NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS autres_frais NUMERIC DEFAULT 0;

-- =====================================================
-- 2. COLONNES DE CRÉDIT
-- =====================================================
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS montant_credit NUMERIC;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS taux_credit NUMERIC;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS duree_credit INTEGER;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS mensualite_credit NUMERIC;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS date_debut_credit DATE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS capital_restant_du NUMERIC;

-- =====================================================
-- 3. COLONNES D'HISTORIQUE
-- =====================================================
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS date_acquisition DATE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS date_mise_en_location DATE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS revenus_anterieurs_override NUMERIC;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS charges_anterieures_override NUMERIC;

-- =====================================================
-- 4. COLONNES DE CHARGES DÉTAILLÉES
-- =====================================================
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS taxe_fonciere NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS charges_copro NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS assurance NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS frais_gestion NUMERIC DEFAULT 0;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS autres_charges NUMERIC DEFAULT 0;

-- =====================================================
-- 5. COLONNES D'ENRICHISSEMENT (BOOLEANS)
-- =====================================================
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_financement BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_investissement BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_historique BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_rentabilite BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_charges BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_locataire BOOLEAN DEFAULT FALSE;

ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS enrichissement_depenses BOOLEAN DEFAULT FALSE;

-- =====================================================
-- VÉRIFICATION : Afficher toutes les colonnes créées
-- =====================================================
-- Décommenter pour vérifier que toutes les colonnes ont été ajoutées :
/*
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'biens'
  AND (
    -- Investissement
    column_name IN ('prix_achat', 'frais_notaire', 'travaux_initiaux', 'autres_frais')
    -- Crédit
    OR column_name IN ('montant_credit', 'taux_credit', 'duree_credit', 'mensualite_credit', 'date_debut_credit', 'capital_restant_du')
    -- Historique
    OR column_name IN ('date_acquisition', 'date_mise_en_location', 'revenus_anterieurs_override', 'charges_anterieures_override')
    -- Charges
    OR column_name IN ('taxe_fonciere', 'charges_copro', 'assurance', 'frais_gestion', 'autres_charges')
    -- Enrichissement
    OR column_name LIKE 'enrichissement_%'
  )
ORDER BY 
  CASE 
    WHEN column_name LIKE 'prix_%' OR column_name LIKE 'frais_%' OR column_name LIKE 'travaux_%' OR column_name = 'autres_frais' THEN 1
    WHEN column_name LIKE '%_credit' OR column_name = 'capital_restant_du' THEN 2
    WHEN column_name LIKE 'date_%' OR column_name LIKE '%_override' THEN 3
    WHEN column_name IN ('taxe_fonciere', 'charges_copro', 'assurance', 'frais_gestion', 'autres_charges') THEN 4
    WHEN column_name LIKE 'enrichissement_%' THEN 5
    ELSE 6
  END,
  column_name;
*/
-- =====================================================
