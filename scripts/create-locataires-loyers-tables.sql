-- =====================================================
-- CRÉATION DES TABLES LOCATAIRES ET LOYERS
-- =====================================================
-- 
-- Ce script crée les tables nécessaires pour les fonctionnalités
-- de gestion des locataires et de suivi des paiements de loyers.
--
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : NETTOYAGE (si les tables existent déjà)
-- =====================================================
DROP TABLE IF EXISTS loyers CASCADE;
DROP TABLE IF EXISTS locataires CASCADE;

-- Supprimer la fonction trigger si elle existe déjà
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- ÉTAPE 2 : CRÉER LA FONCTION TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 3 : CRÉER LA TABLE locataires
-- =====================================================
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign key vers la table biens
  CONSTRAINT fk_locataire_bien 
    FOREIGN KEY (bien_id) 
    REFERENCES biens(id) 
    ON DELETE CASCADE
);

-- =====================================================
-- ÉTAPE 4 : CRÉER LA TABLE loyers
-- =====================================================
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign key vers la table biens
  CONSTRAINT fk_loyer_bien 
    FOREIGN KEY (bien_id) 
    REFERENCES biens(id) 
    ON DELETE CASCADE,
  
  -- Contrainte unique : un seul enregistrement par bien/année/mois
  CONSTRAINT unique_bien_annee_mois 
    UNIQUE (bien_id, annee, mois)
);

-- =====================================================
-- ÉTAPE 5 : CRÉER LES INDEX (après création des tables)
-- =====================================================

-- Index pour la table locataires
CREATE INDEX idx_locataires_bien_id ON locataires(bien_id);

-- Index pour la table loyers
CREATE INDEX idx_loyers_bien_id ON loyers(bien_id);
CREATE INDEX idx_loyers_annee ON loyers(annee);
CREATE INDEX idx_loyers_bien_annee ON loyers(bien_id, annee);

-- =====================================================
-- ÉTAPE 6 : CRÉER LES TRIGGERS (après création des tables)
-- =====================================================

-- Trigger pour locataires
CREATE TRIGGER update_locataires_updated_at
  BEFORE UPDATE ON locataires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour loyers
CREATE TRIGGER update_loyers_updated_at
  BEFORE UPDATE ON loyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 7 : AJOUTER LES COMMENTAIRES
-- =====================================================
COMMENT ON TABLE locataires IS 'Informations sur les locataires des biens immobiliers';
COMMENT ON TABLE loyers IS 'Suivi des paiements de loyers par mois et par année';

COMMENT ON COLUMN loyers.mois IS 'Mois de l''année (0 = Janvier, 11 = Décembre)';
COMMENT ON COLUMN loyers.montant_locataire IS 'Montant payé par le locataire (loyer - APL)';
COMMENT ON COLUMN loyers.montant_apl IS 'Montant des aides au logement (APL)';

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Pour vérifier que les tables ont été créées :
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('locataires', 'loyers');

-- Pour vérifier les colonnes de la table loyers :
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'loyers' 
-- ORDER BY ordinal_position;
