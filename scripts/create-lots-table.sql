-- =====================================================
-- CRÉATION DE LA TABLE LOTS + MIGRATION BIENS EXISTANTS
-- =====================================================
--
-- Ce script crée la table lots pour supporter le multi-lots
-- et le multi-locataires. Un "lot par défaut" est créé pour
-- chaque bien existant (migration douce).
--
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : CRÉER LA TABLE lots
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id UUID NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_lot TEXT DEFAULT 'Principal',
  superficie NUMERIC(10, 2),
  loyer_mensuel NUMERIC(10, 2) NOT NULL DEFAULT 0,
  est_lot_defaut BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 2 : CRÉER LES INDEX
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lots_bien_id ON public.lots(bien_id);
CREATE INDEX IF NOT EXISTS idx_lots_user_id ON public.lots(user_id);

-- =====================================================
-- ÉTAPE 3 : RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lots"
ON public.lots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lots"
ON public.lots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lots"
ON public.lots FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lots"
ON public.lots FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- ÉTAPE 4 : TRIGGER updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_lots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION update_lots_updated_at();

-- =====================================================
-- ÉTAPE 5 : MIGRATION - Créer un lot par défaut
-- pour chaque bien existant
-- =====================================================
INSERT INTO public.lots (bien_id, user_id, numero_lot, loyer_mensuel, est_lot_defaut)
SELECT 
  id as bien_id,
  user_id,
  'Principal' as numero_lot,
  loyer_mensuel,
  true as est_lot_defaut
FROM public.biens
ON CONFLICT DO NOTHING;

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Pour vérifier que la table a été créée :
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'lots';
--
-- Pour vérifier les lots migrés :
-- SELECT l.id, l.bien_id, b.nom, l.numero_lot, l.loyer_mensuel, l.est_lot_defaut
-- FROM public.lots l
-- JOIN public.biens b ON b.id = l.bien_id
-- ORDER BY b.nom;

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE public.lots IS 'Lots associés aux biens immobiliers (support multi-lots et multi-locataires)';
COMMENT ON COLUMN public.lots.numero_lot IS 'Nom/numéro du lot (ex: Principal, T2 RDC, T3 1er étage)';
COMMENT ON COLUMN public.lots.est_lot_defaut IS 'Indique si c''est le lot par défaut créé automatiquement (migration)';
COMMENT ON COLUMN public.lots.superficie IS 'Superficie du lot en m² (optionnel)';
