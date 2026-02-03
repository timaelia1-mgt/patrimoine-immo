import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PLANS } from '@/lib/stripe'
import { UpgradeButton } from '@/components/abonnement/UpgradeButton'

// Désactiver le cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Debug logs
    console.log('[AbonnementPage] user.id:', user.id)
    console.log('[AbonnementPage] user:', { id: user.id, email: user.email })

  const currentPlan = profile.plan || 'decouverte'
  const planDetails = PLANS[currentPlan as keyof typeof PLANS]

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon abonnement</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Gérez votre plan et votre facturation
        </p>
      </div>

      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Plan {planDetails.name}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {planDetails.price === 0 ? (
                  <span className="text-emerald-600 font-semibold">Gratuit</span>
                ) : (
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {planDetails.price}€<span className="text-sm text-slate-500">/mois</span>
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Badge du plan */}
            <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
              currentPlan === 'premium' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : currentPlan === 'essentiel'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {currentPlan === 'premium' ? '💎 Premium' 
                : currentPlan === 'essentiel' ? '⭐ Essentiel' 
                : '🆓 Découverte'}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fonctionnalités incluses */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Fonctionnalités incluses :</h3>
            <ul className="space-y-2">
              {planDetails.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limite de biens */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Limite de biens :</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {planDetails.maxBiens === null ? 'Illimité' : `${planDetails.maxBiens} biens maximum`}
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            {currentPlan === 'decouverte' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Passez à un plan supérieur pour débloquer plus de fonctionnalités
                </p>
                <div className="flex flex-col gap-3">
                  <UpgradeButton 
                    targetPlan="essentiel" 
                    userId={user.id}
                  />
                  <UpgradeButton 
                    targetPlan="premium" 
                    userId={user.id}
                  />
                </div>
              </div>
            )}

            {currentPlan === 'essentiel' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Passez au Premium pour des biens illimités
                </p>
                <UpgradeButton 
                  targetPlan="premium" 
                  userId={user.id}
                />
              </div>
            )}

            {currentPlan === 'premium' && (
              <div className="text-center py-4">
                <p className="text-emerald-600 font-semibold">
                  🎉 Vous avez le meilleur plan ! Profitez de toutes les fonctionnalités.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparaison des plans */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des plans</CardTitle>
          <CardDescription>Trouvez le plan qui vous convient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div 
                key={key}
                className={`p-4 rounded-lg border-2 ${
                  key === currentPlan 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-3">
                  {plan.price === 0 ? 'Gratuit' : `${plan.price}€/mois`}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {plan.maxBiens === null ? 'Biens illimités' : `${plan.maxBiens} biens max`}
                </p>
                {key === currentPlan && (
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    ✓ Plan actuel
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    console.error('Abonnement error:', error)
    redirect('/login')
  }
}
