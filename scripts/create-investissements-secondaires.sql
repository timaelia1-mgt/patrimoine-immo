-- Table pour stocker les investissements secondaires (travaux, réparations après achat)
CREATE TABLE IF NOT EXISTS investissements_secondaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id UUID NOT NULL REFERENCES biens(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_investissements_secondaires_bien_id 
  ON investissements_secondaires(bien_id);

-- RLS (Row Level Security)
ALTER TABLE investissements_secondaires ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs ne peuvent voir que les investissements de leurs biens
CREATE POLICY "Users can view their own investissements_secondaires"
  ON investissements_secondaires
  FOR SELECT
  USING (
    bien_id IN (
      SELECT id FROM biens WHERE user_id = auth.uid()
    )
  );

-- Policy : Les utilisateurs peuvent créer des investissements pour leurs biens
CREATE POLICY "Users can create investissements_secondaires for their biens"
  ON investissements_secondaires
  FOR INSERT
  WITH CHECK (
    bien_id IN (
      SELECT id FROM biens WHERE user_id = auth.uid()
    )
  );

-- Policy : Les utilisateurs peuvent supprimer les investissements de leurs biens
CREATE POLICY "Users can delete their own investissements_secondaires"
  ON investissements_secondaires
  FOR DELETE
  USING (
    bien_id IN (
      SELECT id FROM biens WHERE user_id = auth.uid()
    )
  );
