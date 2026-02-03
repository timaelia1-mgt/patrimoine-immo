"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Settings, Building2, Plus, ChevronDown, CreditCard, LogOut } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getBiens } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"

// Événement personnalisé pour rafraîchir la sidebar
export const REFRESH_SIDEBAR_EVENT = 'refresh-sidebar'

// Fonction utilitaire pour déclencher le refresh de la sidebar
export const refreshSidebar = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFRESH_SIDEBAR_EVENT))
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [biens, setBiens] = useState<any[]>([])
  const [biensExpanded, setBiensExpanded] = useState(true)
  const [loading, setLoading] = useState(true)

  const handleSignOut = async () => {
    try {
      console.log("[Sidebar] Déconnexion en cours...")
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("[Sidebar] Erreur lors de la déconnexion:", error)
        throw error
      }
      
      console.log("[Sidebar] Déconnexion réussie, redirection...")
      
      // Redirection complète pour forcer le rechargement de la session
      window.location.href = '/login'
    } catch (error) {
      console.error("[Sidebar] Erreur lors de la déconnexion:", error)
      // Redirection même en cas d'erreur pour permettre à l'utilisateur de se reconnecter
      window.location.href = '/login'
    }
  }

  const fetchBiens = useCallback(async () => {
    if (!user) {
      setLoading(false)
      setBiens([])
      return
    }

    try {
      console.log("[Sidebar] Récupération des biens pour user:", user.id)
      setLoading(true)
      const data = await getBiens(user.id)
      console.log("[Sidebar] Biens récupérés:", data.length, data)
      setBiens(data)
    } catch (error) {
      console.error("[Sidebar] Erreur lors de la récupération des biens:", error)
      setBiens([])
    } finally {
      setLoading(false)
    }
  }, [user?.id]) // CRITIQUE : Utiliser user?.id (primitif) au lieu de user (objet)

  useEffect(() => {
    console.log("[Sidebar] useEffect déclenché - authLoading:", authLoading, "user:", user?.id)
    
    // Attendre que l'authentification soit chargée
    if (authLoading) {
      console.log("[Sidebar] Auth en cours de chargement, attente...")
      return
    }

    // Charger les biens au montage et quand user change
    fetchBiens()

    // Écouter les événements de refresh
    const handleRefresh = () => {
      console.log("[Sidebar] Événement de refresh reçu")
      if (user) {
        fetchBiens()
      }
    }

    window.addEventListener(REFRESH_SIDEBAR_EVENT, handleRefresh)
    return () => {
      window.removeEventListener(REFRESH_SIDEBAR_EVENT, handleRefresh)
    }
  }, [user?.id, authLoading, fetchBiens]) // CRITIQUE : Utiliser user?.id au lieu de user

  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl">
      {/* Header / Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Patrimoine Immo
            </h1>
            <p className="text-xs text-slate-400">Gestion immobilière</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link
          href="/dashboard"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
            ${isActive("/dashboard")
              ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.02]"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-1"
            }
          `}
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/parametres"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
            ${isActive("/parametres")
              ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.02]"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-1"
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span>Paramètres</span>
        </Link>

        <Link
          href="/abonnement"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
            ${isActive("/abonnement")
              ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.02]"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-1"
            }
          `}
        >
          <CreditCard className="w-5 h-5" />
          <span>Mon abonnement</span>
        </Link>

        {/* Section Mes Biens */}
        <div className="pt-6">
          <button
            onClick={() => setBiensExpanded(!biensExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Mes Biens</span>
              <span className="px-2 py-0.5 bg-slate-700/50 text-xs rounded-full text-slate-300">
                {biens.length}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${biensExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {biensExpanded && (
            <div className="mt-2 space-y-1">
              {loading ? (
                <div className="px-4 py-2 text-sm text-slate-400">Chargement...</div>
              ) : biens.length === 0 ? (
                <div className="px-4 py-2 text-sm text-slate-400">Aucun bien</div>
              ) : (
                biens.map((bien) => (
                  <Link
                    key={bien.id}
                    href={`/biens/${bien.id}`}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${pathname.includes(bien.id)
                        ? "bg-slate-700/50 text-white border-l-2 border-primary-400"
                        : "text-slate-400 hover:bg-slate-800/30 hover:text-white hover:translate-x-1"
                      }
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-400" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{bien.nom}</p>
                      <p className="text-xs text-slate-500 truncate">{bien.ville}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Bouton Ajouter en bas */}
      <div className="p-4 border-t border-slate-700/50">
        <Link
          href="/dashboard?add=true"
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3 
            bg-gradient-to-r from-primary-600 to-primary-500 
            hover:from-primary-500 hover:to-primary-400
            text-white font-semibold rounded-xl
            transition-all duration-200
            shadow-lg shadow-primary-500/30
            hover:shadow-xl hover:shadow-primary-500/40
            hover:scale-[1.02]
            active:scale-95
          "
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un bien</span>
        </Link>

        {/* User info */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "temp@example.com"}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
