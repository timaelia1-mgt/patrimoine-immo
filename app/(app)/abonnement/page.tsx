"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PLANS, type PlanType } from "@/lib/subscription-plans"
import { Check, AlertCircle } from "lucide-react"

export default function AbonnementPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType>("decouverte")
  const [biensCount, setBiensCount] = useState(0)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    // Récupérer le nombre de biens depuis l'API
    fetch("/api/biens")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBiensCount(data.length)
        }
      })
      .catch((error) => {
        console.error("Erreur:", error)
      })
  }, [])

  const plan = PLANS[currentPlan]
  const usagePercentage = (biensCount / plan.maxBiens) * 100

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          text: "text-green-400",
          border: "border-green-500",
          bg: "bg-green-50/10 dark:bg-green-900/10",
          button: "bg-green-600 hover:bg-green-700",
          check: "text-green-500"
        }
      case "blue":
        return {
          text: "text-sky-400",
          border: "border-sky-500",
          bg: "bg-sky-50/10 dark:bg-sky-900/10",
          button: "bg-sky-500 hover:bg-sky-600",
          check: "text-sky-400"
        }
      case "purple":
        return {
          text: "text-purple-400",
          border: "border-purple-500",
          bg: "bg-purple-50/10 dark:bg-purple-900/10",
          button: "bg-purple-600 hover:bg-purple-700",
          check: "text-purple-400"
        }
      default:
        return {
          text: "text-slate-400",
          border: "border-slate-500",
          bg: "bg-slate-50/10 dark:bg-slate-900/10",
          button: "bg-slate-600 hover:bg-slate-700",
          check: "text-slate-400"
        }
    }
  }

  const handleUpgrade = (planId: PlanType) => {
    alert("Disponible après authentification (Phase 5)")
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
            Mon abonnement
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez votre plan et vos limitations
          </p>
        </div>

        {/* Plan actuel */}
        <Card className="border-0 shadow-medium bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">Plan actuel</CardTitle>
            <CardDescription>
              Vous êtes actuellement sur le plan {plan.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Biens utilisés
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {biensCount} / {plan.maxBiens} bien{plan.maxBiens > 1 ? "s" : ""} utilisé{plan.maxBiens > 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usagePercentage >= 100
                      ? "bg-red-500"
                      : usagePercentage >= 80
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              {usagePercentage >= 100 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Limite atteinte. Passez à un plan supérieur pour ajouter plus de biens.
                </p>
              )}
            </div>

            <div className="pt-4 border-t dark:border-slate-700">
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
                Fonctionnalités incluses
              </h3>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => {
                  const colors = getColorClasses(plan.color)
                  return (
                    <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Check className={`w-4 h-4 ${colors.check}`} />
                      {feature}
                    </li>
                  )
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Changer de plan */}
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Changer de plan
          </h2>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAnnual ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}`}>
              Annuel
            </span>
            {isAnnual && (
              <span className="text-sm text-green-500 font-medium">Économisez 17%</span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan Découverte */}
            {(() => {
              const planData = PLANS.decouverte
              const colors = getColorClasses(planData.color)
              return (
                <Card className={`border-2 ${
                  currentPlan === "decouverte"
                    ? `${colors.border} ${colors.bg}`
                    : "border-slate-200 dark:border-slate-700"
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-xl ${colors.text}`}>Découverte</CardTitle>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">0€</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {planData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Check className={`w-4 h-4 ${colors.check}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={currentPlan === "decouverte" ? "default" : "outline"}
                      disabled={currentPlan === "decouverte"}
                      onClick={() => handleUpgrade("decouverte")}
                    >
                      {currentPlan === "decouverte" ? "Plan actuel" : "Passer à Découverte"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Plan Investisseur */}
            {(() => {
              const planData = PLANS.investisseur
              const colors = getColorClasses(planData.color)
              return (
                <Card className={`border-2 relative ${
                  currentPlan === "investisseur"
                    ? `${colors.border} ${colors.bg}`
                    : colors.border
                }`}>
                  {planData.popular && currentPlan !== "investisseur" && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <Badge className="bg-sky-500 text-white">Populaire</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className={`text-xl ${colors.text}`}>Investisseur</CardTitle>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {isAnnual ? `${planData.priceAnnual}€` : `${planData.price}€`}
                      </span>
                      <span className="text-slate-400 text-sm">
                        {isAnnual ? "/an" : "/mois"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {planData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Check className={`w-4 h-4 ${colors.check}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${colors.button} text-white`}
                      disabled={currentPlan === "investisseur"}
                      onClick={() => handleUpgrade("investisseur")}
                    >
                      {currentPlan === "investisseur" ? "Plan actuel" : "Passer à Investisseur"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Plan Patrimoine */}
            {(() => {
              const planData = PLANS.patrimoine
              const colors = getColorClasses(planData.color)
              return (
                <Card className={`border-2 ${
                  currentPlan === "patrimoine"
                    ? `${colors.border} ${colors.bg}`
                    : colors.border
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-xl ${colors.text}`}>Patrimoine</CardTitle>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {isAnnual ? `${planData.priceAnnual}€` : `${planData.price}€`}
                      </span>
                      <span className="text-slate-400 text-sm">
                        {isAnnual ? "/an" : "/mois"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {planData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Check className={`w-4 h-4 ${colors.check}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${colors.button} text-white`}
                      disabled={currentPlan === "patrimoine"}
                      onClick={() => handleUpgrade("patrimoine")}
                    >
                      {currentPlan === "patrimoine" ? "Plan actuel" : "Passer à Patrimoine"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
