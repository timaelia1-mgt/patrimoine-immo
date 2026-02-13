'use client'

import type { LucideIcon } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: ButtonProps["variant"]
  }
  className?: string
}

/**
 * Professional empty state with optional CTA
 *
 * @example
 * <EmptyState
 *   icon={Home}
 *   title="Aucun bien"
 *   description="Ajoutez votre premier bien pour commencer"
 *   action={{
 *     label: "Ajouter un bien",
 *     href: "/dashboard?add=true"
 *   }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const isDefaultVariant = !action?.variant || action.variant === "default"

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-[var(--color-brand-primary)]/10 p-4 border border-[var(--color-border-brand)]">
          <Icon className="h-10 w-10 text-[var(--color-brand-secondary)]" />
        </div>
      )}

      <h3 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>

      {description && (
        <p className="mb-6 text-sm text-[var(--color-text-secondary)] max-w-md">
          {description}
        </p>
      )}

      {action && (
        action.href ? (
          <Button
            asChild
            variant={action.variant || "default"}
            className={cn(
              isDefaultVariant && "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-muted)] hover:opacity-90 text-white shadow-brand-glow"
            )}
          >
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            className={cn(
              isDefaultVariant && "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-muted)] hover:opacity-90 text-white shadow-brand-glow"
            )}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
