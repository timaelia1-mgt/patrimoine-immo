"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, Building2, Plus, ChevronDown, CreditCard, LogOut, Search, TrendingUp } from "lucide-react"
import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Bien } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"
import { PLANS } from "@/lib/stripe"
import type { PlanType } from "@/lib/stripe"
import { calculateChargesMensuelles } from "@/lib/calculations"
import { trackEvent, resetUser, ANALYTICS_EVENTS } from "@/lib/analytics"
import { useBiens } from "@/lib/hooks/use-biens"
import { useProfile } from "@/lib/hooks/use-profile"

// Conservé pour compatibilité (no-op, React Query gère l'invalidation automatiquement)
export const REFRESH_SIDEBAR_EVENT = 'refresh-sidebar'
export const refreshSidebar = () => {
  // No-op : React Query invalide le cache automatiquement via les mutations
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const [biensExpanded, setBiensExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredBien, setHoveredBien] = useState<string | null>(null)

  // Hooks React Query (cache partagé avec le Dashboard)
  const { data: biens = [], isLoading: biensLoading } = useBiens({
    userId: user?.id || '',
    enabled: !!user?.id,
  })

  const { data: profile, isLoading: profileLoading } = useProfile({
    userId: user?.id || '',
    enabled: !!user?.id,
  })

  const loading = (authLoading && !user?.id) || biensLoading || profileLoading

  const handleSignOut = async () => {
    try {
      // Track logout AVANT de reset
      trackEvent(ANALYTICS_EVENTS.LOGOUT)

      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[Sidebar] Erreur lors de la déconnexion:", error)
        throw error
      }

      // Reset PostHog identity
      resetUser()

      // Redirection complète pour forcer le rechargement de la session
      window.location.href = '/login'
    } catch (error) {
      console.error("[Sidebar] Erreur lors de la déconnexion:", error)
      resetUser()
      window.location.href = '/login'
    }
  }

  const navigationLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/parametres', icon: Settings, label: 'Paramètres' },
    { href: '/abonnement', icon: CreditCard, label: 'Mon abonnement' },
  ]

  // Filtrer les biens selon la recherche
  const filteredBiens = useMemo(() => {
    if (!searchQuery.trim()) return biens

    const query = searchQuery.toLowerCase()
    return biens.filter(bien =>
      bien.nom?.toLowerCase().includes(query) ||
      bien.ville?.toLowerCase().includes(query)
    )
  }, [biens, searchQuery])

  // Calculer le cash-flow d'un bien
  const calculateCashFlow = (bien: Bien) => {
    const loyer = bien.loyerMensuel || 0
    if (loyer === 0) return null
    const charges = calculateChargesMensuelles(bien)
    const mensualite = bien.typeFinancement === 'CREDIT' ? (bien.mensualiteCredit || 0) : 0
    return loyer - charges - mensualite
  }

  // Plan et limites
  const currentPlan = (profile?.plan || 'gratuit') as PlanType
  // Vérifier que le plan existe, sinon fallback sur 'gratuit'
  const maxBiens = PLANS[currentPlan]?.maxBiens ?? PLANS['gratuit'].maxBiens
  const canAddMore = maxBiens === null || biens.length < maxBiens

  return (
    <aside className="h-screen w-72 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-amber-900/20 relative overflow-hidden">
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Accent border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header avec logo */}
        <div className="p-6 pb-4 border-b border-slate-800/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/40 transition-all duration-300 group-hover:scale-105">
                <Building2 className="w-6 h-6 text-amber-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-lg font-semibold bg-gradient-to-r from-amber-200 via-amber-100 to-slate-200 bg-clip-text text-transparent tracking-tight">
                Patrimoine Immo
              </h1>
              <p className="text-[11px] text-slate-500 tracking-wide uppercase mt-0.5">Gestion Premium</p>
            </div>
          </Link>
        </div>

        {/* Navigation principale */}
        <nav className="px-4 py-6 space-y-1.5">
          {navigationLinks.map((link) => {
            const Icon = link.icon
            const isLinkActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative
                  ${isLinkActive
                    ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-400 shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
                  }
                `}
              >
                {isLinkActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 transition-all duration-300 ${isLinkActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`font-medium text-[15px] tracking-tight ${isLinkActive ? 'font-semibold' : ''}`}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Section Mes Biens */}
        <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
          <div className="mb-3">
            <button
              onClick={() => setBiensExpanded(!biensExpanded)}
              className="w-full flex items-center justify-between px-2 py-2 text-slate-500 hover:text-amber-400 transition-all duration-300 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-widest uppercase">Mes Biens</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800/60 text-amber-400 rounded-full border border-amber-500/20">
                  {biens.length}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-all duration-300 ${biensExpanded ? 'rotate-180' : ''} group-hover:text-amber-400`} />
            </button>

            {biensExpanded && (
              <div className="mt-3">
                {/* Search bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>

          {biensExpanded && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loading ? (
                <div role="status" className="flex items-center justify-center py-8 text-slate-500 text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-700 border-t-amber-500" />
                </div>
              ) : filteredBiens.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm">
                  {searchQuery ? 'Aucun bien trouvé' : 'Aucun bien'}
                </div>
              ) : (
                filteredBiens.map((bien) => {
                  const isBienActive = pathname.includes(bien.id)
                  const cashFlow = calculateCashFlow(bien)
                  const isHovered = hoveredBien === bien.id

                  return (
                    <Link
                      key={bien.id}
                      href={`/biens/${bien.id}`}
                      onMouseEnter={() => setHoveredBien(bien.id)}
                      onMouseLeave={() => setHoveredBien(null)}
                      className={`
                        group block relative overflow-hidden rounded-xl transition-all duration-300
                        ${isBienActive
                          ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/80 hover:bg-slate-800/40'
                        }
                      `}
                    >
                      {isBienActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-600" />
                      )}

                      <div className="p-3">
                        {/* Header avec nom */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                              <h4 className={`font-medium text-[13px] truncate transition-colors ${isBienActive ? 'text-amber-300' : 'text-slate-300 group-hover:text-slate-200'}`}>
                                {bien.nom}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 ml-3.5">{bien.ville}</p>
                          </div>
                        </div>

                        {/* KPIs inline - visibles au hover ou quand actif */}
                        <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ${isHovered || isBienActive ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                          {bien.loyerMensuel > 0 && (
                            <div className="bg-slate-950/50 rounded-lg px-2 py-1.5 border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Loyer</div>
                              <div className="text-xs font-semibold text-amber-400">
                                {bien.loyerMensuel.toLocaleString('fr-FR')} €
                              </div>
                            </div>
                          )}

                          {cashFlow !== null && (
                            <div className="bg-slate-950/50 rounded-lg px-2 py-1.5 border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                <TrendingUp className="w-2.5 h-2.5" />
                                CF
                              </div>
                              <div className={`text-xs font-semibold ${cashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {cashFlow >= 0 ? '+' : ''}{cashFlow.toLocaleString('fr-FR')} €
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Séparateur doré */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        {/* Bouton Ajouter un bien */}
        <div className="p-4">
          {canAddMore ? (
            <Link
              href="/dashboard?add=true"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Ajouter un bien
            </Link>
          ) : (
            <div>
              <Link
                href="/abonnement"
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:bg-slate-800 hover:text-amber-400 hover:border-amber-500/30"
              >
                <CreditCard className="w-5 h-5" />
                Limite atteinte
              </Link>
              <p className="text-center text-[11px] text-slate-600 mt-2">
                {biens.length}/{maxBiens} biens · Passez au plan supérieur
              </p>
            </div>
          )}
        </div>

        {/* Séparateur doré */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        {/* User info + déconnexion */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-amber-400 font-bold text-sm border border-slate-700/50">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-300 truncate">
                {user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <p className="text-[11px] text-slate-600 truncate">
                {user?.email || "temp@example.com"}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-slate-500 hover:text-amber-400 hover:bg-slate-800/40 rounded-lg transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 119, 6, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 119, 6, 0.5);
        }
      `}</style>
    </aside>
  )
}
