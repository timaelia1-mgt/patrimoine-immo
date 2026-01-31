-- =====================================================
-- Script SQL : Ajout des colonnes manquantes à la table biens
-- =====================================================
-- Ce script ajoute toutes les colonnes nécessaires pour le système d'enrichissement
-- et les données d'investissement.
-- 
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- =====================================================

-- Colonne d'investissement : autres_frais
ALTER TABLE biens 
ADD COLUMN IF NOT EXISTS autres_frais NUMERIC DEFAULT 0;

-- Colonnes d'enrichissement (booléens)
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
-- Vérification : Afficher les colonnes ajoutées
-- =====================================================
-- Décommenter pour vérifier que les colonnes ont été ajoutées :
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'biens'
--   AND column_name LIKE 'enrichissement_%'
-- ORDER BY column_name;
-- =====================================================
