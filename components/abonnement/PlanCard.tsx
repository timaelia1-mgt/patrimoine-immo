'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  name: string
  price: number
  priceId: string | null
  maxBiens: number | null
  features: readonly string[]
  isCurrentPlan: boolean
  isPopular?: boolean
  isAnnual?: boolean
  onUpgrade: (priceId: string, planName: string) => void
  disabled?: boolean
  loading?: boolean
}

export function PlanCard({
  name,
  price,
  priceId,
  maxBiens,
  features,
  isCurrentPlan,
  isPopular = false,
  isAnnual = false,
  onUpgrade,
  disabled = false,
  loading = false,
}: PlanCardProps) {
  const handleUpgrade = () => {
    if (priceId && !isCurrentPlan && !disabled) {
      onUpgrade(priceId, name)
    }
  }

  // Calcul du prix affiché
  const displayPrice = isAnnual && price > 0
    ? parseFloat((price * 0.8).toFixed(2))
    : price

  // Prix annuel total
  const annualTotal = parseFloat((displayPrice * 12).toFixed(2))

  return (
    <Card
      className={cn(
        'relative p-6 flex flex-col transition-all duration-200',
        isPopular && 'border-2 border-amber-500 shadow-xl md:scale-105 z-10',
        isCurrentPlan && 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700',
        !isPopular && !isCurrentPlan && 'hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      {/* Badge Popular */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
          ⭐ Populaire
        </div>
      )}

      {/* Badge Plan actuel */}
      {isCurrentPlan && (
        <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
          ✓ Plan actuel
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6 pt-2">
        <h3 className={cn(
          "text-2xl font-bold mb-2",
          isPopular && "text-amber-500"
        )}>
          {name}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          {price === 0 ? (
            <span className="text-4xl font-bold text-green-600 dark:text-green-400">Gratuit</span>
          ) : (
            <>
              <span className="text-4xl font-bold">{displayPrice.toFixed(2).replace('.', ',')}€</span>
              <span className="text-slate-500 dark:text-slate-400">/mois</span>
            </>
          )}
        </div>
        {isAnnual && price > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            Facturé <span className="line-through">{(price * 12).toFixed(2).replace('.', ',')}€</span>{' '}
            <span className="text-emerald-400 font-medium">{annualTotal.toFixed(2).replace('.', ',')}€/an</span>
            <span className="ml-1 text-emerald-400">(économisez 20%)</span>
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {maxBiens === null ? '♾️ Biens illimités' : `📦 Jusqu'à ${maxBiens} bien${maxBiens > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-700 my-4" />

      {/* Features */}
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className={cn(
              "h-5 w-5 flex-shrink-0 mt-0.5",
              isPopular ? "text-amber-500" : "text-green-600 dark:text-green-400"
            )} />
            <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {isCurrentPlan ? (
        <Button 
          variant="outline" 
          disabled 
          className="w-full border-green-500 text-green-600 dark:text-green-400"
        >
          ✓ Plan actuel
        </Button>
      ) : price === 0 ? (
        <Button variant="ghost" disabled className="w-full text-slate-500">
          Plan de base
        </Button>
      ) : (
        <LoadingButton
          onClick={handleUpgrade}
          disabled={disabled}
          loading={loading}
          loadingText="Chargement..."
          className={cn(
            'w-full font-semibold',
            isPopular 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg' 
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          )}
        >
          {`Passer à ${name}`}
        </LoadingButton>
      )}
    </Card>
  )
}
