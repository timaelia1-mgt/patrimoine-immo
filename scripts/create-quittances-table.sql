-- Table pour stocker l'historique des quittances générées
CREATE TABLE IF NOT EXISTS quittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id UUID NOT NULL REFERENCES biens(id) ON DELETE CASCADE,
  
  -- Période
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2000 AND annee <= 2100),
  
  -- Locataire
  locataire_nom TEXT NOT NULL,
  locataire_prenom TEXT NOT NULL,
  locataire_email TEXT,
  
  -- Montants
  montant_locataire NUMERIC(10, 2) NOT NULL DEFAULT 0,
  montant_apl NUMERIC(10, 2) NOT NULL DEFAULT 0,
  montant_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Dates de paiement
  date_paye_locataire DATE NOT NULL,
  date_paye_apl DATE,
  mode_paiement TEXT NOT NULL DEFAULT 'virement',
  
  -- Metadata
  email_envoye BOOLEAN NOT NULL DEFAULT false,
  date_envoi_email TIMESTAMPTZ,
  pdf_url TEXT, -- Pour stocker l'URL du PDF si on veut le sauvegarder
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique : une seule quittance par bien/mois/année
  CONSTRAINT unique_quittance_bien_mois_annee UNIQUE (bien_id, mois, annee)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_quittances_user_id ON quittances(user_id);
CREATE INDEX IF NOT EXISTS idx_quittances_bien_id ON quittances(bien_id);
CREATE INDEX IF NOT EXISTS idx_quittances_mois_annee ON quittances(mois, annee);
CREATE INDEX IF NOT EXISTS idx_quittances_created_at ON quittances(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE quittances ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres quittances
CREATE POLICY "Users can view their own quittances"
  ON quittances
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent créer leurs propres quittances
CREATE POLICY "Users can create their own quittances"
  ON quittances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier leurs propres quittances
CREATE POLICY "Users can update their own quittances"
  ON quittances
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leurs propres quittances
CREATE POLICY "Users can delete their own quittances"
  ON quittances
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_quittances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quittances_updated_at
  BEFORE UPDATE ON quittances
  FOR EACH ROW
  EXECUTE FUNCTION update_quittances_updated_at();

-- Commentaires
COMMENT ON TABLE quittances IS 'Historique des quittances de loyer générées';
COMMENT ON COLUMN quittances.email_envoye IS 'Indique si la quittance a été envoyée par email';
COMMENT ON COLUMN quittances.pdf_url IS 'URL du PDF stocké (optionnel, pour archivage)';
