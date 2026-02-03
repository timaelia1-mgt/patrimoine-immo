-- Ajouter les colonnes Stripe dans profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);
