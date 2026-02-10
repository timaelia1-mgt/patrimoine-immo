-- =====================================================
-- ÉTAPE 2 : MIGRATION LOCATAIRES - Support multi-locataires via lots
-- =====================================================
--
-- Ce script ajoute lot_id dans locataires, retire la contrainte
-- UNIQUE sur bien_id, et migre les locataires existants vers
-- leur lot par défaut.
--
-- Prérequis : avoir exécuté create-lots-table.sql (ÉTAPE 1)
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : Ajouter la colonne lot_id (nullable au début)
-- =====================================================
ALTER TABLE public.locataires 
ADD COLUMN IF NOT EXISTS lot_id UUID;

-- =====================================================
-- ÉTAPE 2 : Migrer les locataires existants vers leur lot par défaut
-- =====================================================
UPDATE public.locataires l
SET lot_id = (
  SELECT lot.id 
  FROM public.lots lot
  WHERE lot.bien_id = l.bien_id 
    AND lot.est_lot_defaut = true
  LIMIT 1
)
WHERE lot_id IS NULL;

-- =====================================================
-- ÉTAPE 3 : Rendre lot_id obligatoire maintenant que
-- tous les locataires ont un lot
-- =====================================================
ALTER TABLE public.locataires
ALTER COLUMN lot_id SET NOT NULL;

-- =====================================================
-- ÉTAPE 4 : Retirer la contrainte UNIQUE sur bien_id
-- (permet d'avoir plusieurs locataires par bien)
-- =====================================================
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'locataires' 
    AND con.contype = 'u'
    AND con.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = rel.oid AND attname = 'bien_id')];
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.locataires DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 5 : Ajouter contrainte foreign key sur lot_id
-- =====================================================
ALTER TABLE public.locataires
ADD CONSTRAINT fk_locataire_lot
FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- =====================================================
-- ÉTAPE 6 : Ajouter index sur lot_id pour les performances
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_locataires_lot_id ON public.locataires(lot_id);

-- =====================================================
-- ÉTAPE 7 : Garder bien_id pour compatibilité temporaire
-- On ajoute juste un index si pas déjà présent
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_locataires_bien_id ON public.locataires(bien_id);

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Vérifier que tous les locataires ont un lot_id
SELECT 
  COUNT(*) as total_locataires,
  COUNT(lot_id) as locataires_avec_lot,
  COUNT(bien_id) as locataires_avec_bien
FROM public.locataires;

-- Vérifier les détails de la migration
-- SELECT l.id, l.nom, l.prenom, l.bien_id, l.lot_id, lot.numero_lot
-- FROM public.locataires l
-- LEFT JOIN public.lots lot ON lot.id = l.lot_id
-- ORDER BY l.nom;

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON COLUMN public.locataires.lot_id IS 'Référence vers le lot auquel appartient le locataire';
