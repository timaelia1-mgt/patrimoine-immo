"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { User, Session } from "@supabase/supabase-js"
import { createClient } from "./supabase/client"
import { createUserProfile, getUserProfile } from "./database"
import { logger } from "./logger"
import { toast } from "sonner"
import { identifyUser, trackEvent, resetUser, ANALYTICS_EVENTS } from "@/lib/analytics"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const hasTrackedSession = useRef(false) // Tracker login une seule fois par session
  
  const supabase = useRef<ReturnType<typeof createClient> | null>(null)

  const createProfileIfNeeded = useCallback(async (userId: string, email: string, name?: string) => {
    try {
      const profile = await getUserProfile(userId)
      if (!profile) {
        await createUserProfile(userId, email, name)
      }
    } catch (error: unknown) {
      logger.error("[AuthContext] Erreur lors de la création du profil:", error)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    if (!supabase.current) {
      supabase.current = createClient()
    }
    const supabaseClient = supabase.current

    // Flag pour savoir si la session initiale a été résolue
    let initialSessionResolved = false

    // Fonction async pour les opérations secondaires (profil + analytics)
    // Ne bloque PAS le loading state
    const handleSessionSideEffects = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        hasTrackedSession.current = false
        return
      }

      try {
        await createProfileIfNeeded(
          currentSession.user.id,
          currentSession.user.email || "",
          currentSession.user.user_metadata?.name
        )
      } catch (err) {
        logger.error("[AuthContext] Erreur lors de la création du profil:", err)
      }

      // Identify user dans PostHog
      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('plan_type, name, email')
          .eq('id', currentSession.user.id)
          .single()

        if (!isMounted) return

        identifyUser(currentSession.user.id, {
          email: profile?.email || currentSession.user.email,
          plan_type: profile?.plan_type || 'gratuit',
          name: profile?.name,
          created_at: currentSession.user.created_at,
        })

        // Track login seulement la première fois
        if (!hasTrackedSession.current) {
          trackEvent(ANALYTICS_EVENTS.LOGIN, {
            plan_type: profile?.plan_type || 'gratuit',
          })
          hasTrackedSession.current = true
          logger.info('[Auth] User login tracked', {
            userId: currentSession.user.id,
          })
        }
      } catch (err) {
        logger.error("[AuthContext] Erreur analytics identify:", err)
      }
    }

    // Listener pour les changements d'état d'auth
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event: string, currentSession: Session | null) => {
        if (!isMounted) return
        
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        if (currentSession) {
          // Session valide → on peut mettre loading=false immédiatement
          setLoading(false)
          initialSessionResolved = true
          // Side effects en arrière-plan
          handleSessionSideEffects(currentSession)
        } else if (event === 'SIGNED_OUT') {
          // Déconnexion explicite → loading=false
          setLoading(false)
          initialSessionResolved = true
          hasTrackedSession.current = false
        } else if (event === 'INITIAL_SESSION') {
          // INITIAL_SESSION avec session null → NE PAS mettre loading=false !
          // On attend la vérification côté serveur pour confirmer.
          // Si le serveur confirme aussi null → loading sera mis à false par le fetch.
          // Cela évite la race condition où on redirige vers /login prématurément.
          if (initialSessionResolved) {
            // Le fetch serveur a déjà répondu → on peut set loading=false
            setLoading(false)
          }
          // sinon, on laisse le fetch serveur décider
        } else {
          // Autre event (TOKEN_REFRESHED, etc.) sans session → loading=false
          setLoading(false)
          initialSessionResolved = true
        }
      }
    )
    
    // Vérification côté serveur (backup fiable)
    // Le serveur peut lire les cookies HTTP-only et valider la session
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(({ session: serverSession }) => {
        if (!isMounted) return
        initialSessionResolved = true
        
        if (serverSession) {
          setSession(serverSession)
          setUser(serverSession.user)
          // Side effects en arrière-plan
          handleSessionSideEffects(serverSession)
        }
        // CRITIQUE : TOUJOURS mettre loading=false, même si session est null
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Auth] Server session check failed:', err)
        if (isMounted) {
          initialSessionResolved = true
          setLoading(false)
        }
      })

    // Safety net : si rien ne résout après 8 secondes, forcer loading=false
    // Empêche le chargement infini dans tous les cas extrêmes
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Safety timeout: forcing loading=false after 8s')
        setLoading(false)
      }
    }, 8000)

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [createProfileIfNeeded])

  const signOut = useCallback(async () => {
    try {
      // Track logout AVANT de reset
      trackEvent(ANALYTICS_EVENTS.LOGOUT)
  
      // Utiliser le client via ref
      if (!supabase.current) {
        supabase.current = createClient()
      }
      const { error } = await supabase.current.auth.signOut()
      if (error) {
        logger.error("[AuthContext] Erreur lors de la déconnexion:", error)
        throw error
      }
  
      // Reset PostHog identity
      resetUser()
      hasTrackedSession.current = false
  
      setUser(null)
      setSession(null)
      toast.success('Déconnexion réussie')
      // Redirection vers login avec force reload pour nettoyer l'état
      window.location.href = '/login'
    } catch (error: unknown) {
      logger.error("[AuthContext] Erreur dans signOut:", error)
      // Reset PostHog même en cas d'erreur
      resetUser()
      hasTrackedSession.current = false
      // Nettoyer l'état même en cas d'erreur
      setUser(null)
      setSession(null)
      toast.success('Déconnexion réussie')
      // Redirection même en cas d'erreur pour garantir le nettoyage
      window.location.href = '/login'
      throw error
    }
  }, [])

  // CRITIQUE : Mémoriser l'objet value pour éviter les re-renders en cascade
  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      signOut,
    }),
    [user, session, loading, signOut]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
