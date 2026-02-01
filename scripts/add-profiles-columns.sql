-- =====================================================
-- Script SQL : Ajouter les colonnes manquantes à la table profiles
-- =====================================================
-- 
-- Ce script ajoute toutes les colonnes nécessaires pour la table profiles
-- dans Supabase, notamment la colonne 'name' qui est utilisée dans
-- la page Paramètres.
--
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Ajouter la colonne 'name' (nom de l'utilisateur)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Ajouter la colonne 'created_at' si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ajouter la colonne 'updated_at' si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Colonnes optionnelles pour les paramètres futurs (gestion des loyers)
-- Ces colonnes peuvent être ajoutées maintenant pour éviter de futures migrations
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rent_payment_day INTEGER DEFAULT 5;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payment_delay_days INTEGER DEFAULT 5;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN DEFAULT true;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_notifications_enabled BOOLEAN DEFAULT true;

-- 5. Créer ou remplacer la fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Supprimer le trigger s'il existe déjà (pour éviter les doublons)
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;

-- 7. Créer le trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_profiles_timestamp 
BEFORE UPDATE ON profiles
FOR EACH ROW 
EXECUTE FUNCTION update_profiles_updated_at();

-- 8. Mettre à jour les enregistrements existants pour initialiser created_at et updated_at
-- si ces colonnes venaient d'être créées
UPDATE profiles 
SET 
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- =====================================================
-- Vérification : Afficher la structure de la table
-- =====================================================
-- Exécuter cette requête pour vérifier que toutes les colonnes sont présentes :
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
-- =====================================================
