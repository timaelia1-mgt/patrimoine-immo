-- =====================================================
-- ÉTAPE 3 : Ajouter locataire_id dans loyers et quittances
-- =====================================================
--
-- Ce script ajoute locataire_id dans les tables loyers et quittances,
-- modifie les contraintes UNIQUE pour permettre plusieurs loyers/quittances
-- par bien/mois (un par locataire).
--
-- Prérequis : avoir exécuté migrate-locataires-add-lot.sql (ÉTAPE 2)
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- ============================================
-- PARTIE 1 : TABLE LOYERS
-- ============================================

-- 1. Ajouter la colonne locataire_id (nullable pour rétro-compatibilité)
ALTER TABLE public.loyers 
ADD COLUMN IF NOT EXISTS locataire_id UUID;

-- 2. Ajouter foreign key sur locataire_id
ALTER TABLE public.loyers
ADD CONSTRAINT fk_loyer_locataire
FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE CASCADE;

-- 3. Ajouter index sur locataire_id
CREATE INDEX IF NOT EXISTS idx_loyers_locataire_id ON public.loyers(locataire_id);

-- 4. Retirer l'ancienne contrainte UNIQUE (bien_id, annee, mois)
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'loyers' 
    AND con.contype = 'u'
    AND array_length(con.conkey, 1) = 3;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.loyers DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 5. Ajouter nouvelle contrainte UNIQUE (bien_id, locataire_id, annee, mois)
-- Permet plusieurs loyers par bien/mois (un par locataire)
ALTER TABLE public.loyers
ADD CONSTRAINT unique_loyer_bien_locataire_mois 
UNIQUE (bien_id, locataire_id, annee, mois);

-- ============================================
-- PARTIE 2 : TABLE QUITTANCES
-- ============================================

-- 1. Ajouter la colonne locataire_id (nullable pour rétro-compatibilité)
ALTER TABLE public.quittances 
ADD COLUMN IF NOT EXISTS locataire_id UUID;

-- 2. Ajouter foreign key sur locataire_id
ALTER TABLE public.quittances
ADD CONSTRAINT fk_quittance_locataire
FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE CASCADE;

-- 3. Ajouter index sur locataire_id
CREATE INDEX IF NOT EXISTS idx_quittances_locataire_id ON public.quittances(locataire_id);

-- 4. Retirer l'ancienne contrainte UNIQUE (bien_id, mois, annee)
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'quittances' 
    AND con.contype = 'u'
    AND array_length(con.conkey, 1) = 3;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.quittances DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 5. Ajouter nouvelle contrainte UNIQUE (bien_id, locataire_id, mois, annee)
-- Permet plusieurs quittances par bien/mois (une par locataire)
ALTER TABLE public.quittances
ADD CONSTRAINT unique_quittance_bien_locataire_mois 
UNIQUE (bien_id, locataire_id, mois, annee);

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier loyers
SELECT 
  COUNT(*) as total_loyers,
  COUNT(locataire_id) as loyers_avec_locataire
FROM public.loyers;

-- Vérifier quittances
SELECT 
  COUNT(*) as total_quittances,
  COUNT(locataire_id) as quittances_avec_locataire
FROM public.quittances;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON COLUMN public.loyers.locataire_id IS 'Référence vers le locataire concerné par ce paiement de loyer';
COMMENT ON COLUMN public.quittances.locataire_id IS 'Référence vers le locataire concerné par cette quittance';
