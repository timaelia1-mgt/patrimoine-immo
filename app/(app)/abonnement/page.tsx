import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PLANS, PlanType } from '@/lib/stripe'
import { ManageSubscriptionButton } from '@/components/abonnement/ManageSubscriptionButton'
import { CheckoutFeedback } from '@/components/abonnement/CheckoutFeedback'
import { PlansSection } from '@/components/abonnement/PlansSection'
import { ComparisonTable } from '@/components/abonnement/ComparisonTable'
import { FAQ } from '@/components/abonnement/FAQ'

export default async function AbonnementPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      redirect('/login')
    }

    const profile = await getUserProfile(user.id, supabase)
    if (!profile) {
      redirect('/login')
    }

    const currentPlan = (profile.plan || 'gratuit') as PlanType
    const planDetails = PLANS[currentPlan] ?? PLANS['gratuit']

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon abonnement</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gérez votre plan et votre facturation
          </p>
        </div>
        
        {/* Bouton gérer abonnement - visible seulement si abonné */}
        <ManageSubscriptionButton 
          hasActiveSubscription={!!profile.stripeCustomerId}
        />
      </div>

      {/* Messages de feedback après checkout */}
      <CheckoutFeedback />

      {/* Plan actuel - Résumé */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Votre plan actuel</p>
              <CardTitle className="text-3xl flex items-center gap-3">
                <span className={`
                  ${currentPlan === 'premium' ? 'text-purple-600 dark:text-purple-400' : ''}
                  ${currentPlan === 'essentiel' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  ${currentPlan === 'gratuit' ? 'text-green-600 dark:text-green-400' : ''}
                `}>
                  {planDetails.name}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentPlan === 'premium' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : currentPlan === 'essentiel'
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {currentPlan === 'premium' ? '💎' : currentPlan === 'essentiel' ? '⭐' : '🆓'}
                </span>
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {planDetails.price === 0 ? (
                  <span className="text-green-600 dark:text-green-400">Gratuit</span>
                ) : (
                  <>
                    <span>{planDetails.price}€</span>
                    <span className="text-base font-normal text-slate-500">/mois</span>
                  </>
                )}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {planDetails.maxBiens === null ? '♾️ Biens illimités' : `📦 ${planDetails.maxBiens} biens max`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {planDetails.features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-green-500">✓</span>
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section titre des plans */}
      <div className="text-center pt-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Choisissez votre plan
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </p>
      </div>

      {/* Grille des plans */}
      <PlansSection currentPlan={currentPlan} userId={user.id} />

      {/* Tableau de comparaison */}
      <ComparisonTable />

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <div className="text-center pt-8 pb-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Des questions ? Contactez-nous à{' '}
          <a href="mailto:support@patrimo.app" className="text-indigo-600 hover:underline">
            support@patrimo.app
          </a>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Paiements sécurisés par Stripe • Annulation possible à tout moment
        </p>
      </div>
    </div>
  )
  } catch {
    redirect('/login')
  }
}
