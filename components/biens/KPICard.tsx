"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  /** Icône Lucide à afficher */
  icon: LucideIcon
  /** Label du KPI */
  label: string
  /** Valeur principale à afficher */
  value: string | number
  /** Sous-texte optionnel (ex: "Par mois", "Annuel") */
  subtext?: string
  /** Badge optionnel (ex: "+12.5%", "3 paiements") */
  badge?: string
  /** Variante de couleur */
  variant?: "amber" | "emerald" | "red" | "purple" | "sky" | "orange" | "slate"
  /** Taille */
  size?: "sm" | "md" | "lg"
  /** Classe CSS additionnelle */
  className?: string
  /** Animation delay pour stagger effect */
  delay?: number
}

const variantStyles = {
  amber: {
    iconBg: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
    iconColor: "text-amber-500",
    valueColor: "text-amber-400",
    shadow: "shadow-amber-500/10 hover:shadow-amber-500/20",
  },
  emerald: {
    iconBg: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
    iconColor: "text-emerald-500",
    valueColor: "text-emerald-400",
    shadow: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
  },
  red: {
    iconBg: "from-red-500/20 to-red-600/10 border-red-500/20",
    iconColor: "text-red-500",
    valueColor: "text-red-400",
    shadow: "shadow-red-500/10 hover:shadow-red-500/20",
  },
  purple: {
    iconBg: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
    iconColor: "text-purple-500",
    valueColor: "text-purple-400",
    shadow: "shadow-purple-500/10 hover:shadow-purple-500/20",
  },
  sky: {
    iconBg: "from-sky-500/20 to-sky-600/10 border-sky-500/20",
    iconColor: "text-sky-500",
    valueColor: "text-sky-400",
    shadow: "shadow-sky-500/10 hover:shadow-sky-500/20",
  },
  orange: {
    iconBg: "from-orange-500/20 to-orange-600/10 border-orange-500/20",
    iconColor: "text-orange-500",
    valueColor: "text-orange-400",
    shadow: "shadow-orange-500/10 hover:shadow-orange-500/20",
  },
  slate: {
    iconBg: "from-slate-500/20 to-slate-600/10 border-slate-500/20",
    iconColor: "text-slate-400",
    valueColor: "text-slate-300",
    shadow: "shadow-slate-500/10 hover:shadow-slate-500/20",
  },
}

const sizeStyles = {
  sm: {
    icon: "w-4 h-4",
    iconContainer: "w-8 h-8 p-1.5",
    value: "text-xl",
    label: "text-xs",
    subtext: "text-[10px]",
    badge: "text-[9px] px-1.5 py-0.5",
  },
  md: {
    icon: "w-5 h-5",
    iconContainer: "w-10 h-10 p-2",
    value: "text-3xl",
    label: "text-sm",
    subtext: "text-xs",
    badge: "text-[10px] px-2 py-0.5",
  },
  lg: {
    icon: "w-6 h-6",
    iconContainer: "w-12 h-12 p-2.5",
    value: "text-4xl",
    label: "text-base",
    subtext: "text-sm",
    badge: "text-xs px-2.5 py-1",
  },
}

export function KPICard({
  icon: Icon,
  label,
  value,
  subtext,
  badge,
  variant = "amber",
  size = "md",
  className,
  delay = 0,
}: KPICardProps) {
  const variantClasses = variantStyles[variant]
  const sizeClasses = sizeStyles[size]

  return (
    <Card
      className={cn(
        "border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl",
        "shadow-2xl transition-all duration-300",
        "hover:scale-[1.02]",
        variantClasses.shadow,
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          {/* Icon */}
          <div
            className={cn(
              "rounded-xl bg-gradient-to-br flex items-center justify-center border transition-all duration-300",
              "group-hover:scale-110",
              variantClasses.iconBg,
              sizeClasses.iconContainer
            )}
          >
            <Icon className={cn(sizeClasses.icon, variantClasses.iconColor)} />
          </div>

          {/* Badge optionnel */}
          {badge && (
            <div
              className={cn(
                "rounded-full font-semibold border",
                sizeClasses.badge,
                variantClasses.iconBg,
                variantClasses.valueColor
              )}
            >
              {badge}
            </div>
          )}
        </div>

        {/* Label */}
        <p className={cn("font-medium text-slate-400 mb-1", sizeClasses.label)}>
          {label}
        </p>

        {/* Value */}
        <p className={cn("font-bold tracking-tight", sizeClasses.value, variantClasses.valueColor)}>
          {value}
        </p>

        {/* Subtext optionnel */}
        {subtext && (
          <p className={cn("text-slate-500 mt-1", sizeClasses.subtext)}>
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
