-- Ajouter la colonne subscription_status pour suivre l'état des abonnements Stripe
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne subscription_status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- 2. Ajouter une contrainte CHECK pour les valeurs valides
-- Note: Si la contrainte existe déjà, cette commande échouera silencieusement
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_subscription_status_check 
    CHECK (subscription_status IS NULL OR subscription_status IN (
      'active',           -- Abonnement actif et paiements OK
      'canceled',         -- Abonnement annulé
      'past_due',         -- Paiement en retard
      'unpaid',           -- Facture impayée
      'payment_failed',   -- Échec de paiement
      'trialing'          -- Période d'essai
    ));
  END IF;
END $$;

-- 3. Mettre à jour les profils existants avec un abonnement actif
UPDATE profiles 
SET subscription_status = 'active' 
WHERE stripe_subscription_id IS NOT NULL 
  AND subscription_status IS NULL;

-- 4. Créer un index pour les requêtes par statut
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status 
ON profiles(subscription_status);

-- 5. Commentaire sur la colonne
COMMENT ON COLUMN profiles.subscription_status IS 
'Statut de l''abonnement Stripe: active, canceled, past_due, unpaid, payment_failed, trialing';
