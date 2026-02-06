-- Migration des noms de plans : decouverte → gratuit
-- À exécuter dans Supabase SQL Editor

-- 1. D'abord, mettre à jour toutes les valeurs existantes
UPDATE profiles 
SET plan_type = 'gratuit' 
WHERE plan_type = 'decouverte';

-- 2. Supprimer l'ancienne contrainte CHECK
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

-- 3. Recréer la contrainte avec les nouveaux noms de plans
ALTER TABLE profiles 
ADD CONSTRAINT profiles_plan_type_check 
CHECK (plan_type IN ('gratuit', 'essentiel', 'premium'));

-- 4. Mettre à jour la valeur par défaut
ALTER TABLE profiles 
ALTER COLUMN plan_type SET DEFAULT 'gratuit';
