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
  
  // CRITIQUE : Créer supabase une seule fois avec useMemo pour éviter les re-renders infinis
  const supabase = useMemo(() => createClient(), [])

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

    // UN SEUL listener pour TOUT gérer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Créer le profil si nécessaire
        if (session?.user) {
          try {
            await createProfileIfNeeded(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.name
            )
          } catch (err) {
            logger.error("[AuthContext] Erreur lors de la création du profil:", err)
          }

          // Identify user dans PostHog (toujours, pour garder les propriétés à jour)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('plan_type, name, email')
              .eq('id', session.user.id)
              .single()

            identifyUser(session.user.id, {
              email: profile?.email || session.user.email,
              plan_type: profile?.plan_type || 'gratuit',
              name: profile?.name,
              created_at: session.user.created_at,
            })

            // Track login seulement la première fois (éviter double track au refresh)
            if (!hasTrackedSession.current) {
              trackEvent(ANALYTICS_EVENTS.LOGIN, {
                plan_type: profile?.plan_type || 'gratuit',
              })
              hasTrackedSession.current = true
              logger.info('[Auth] User login tracked', {
                userId: session.user.id,
              })
            }
          } catch (err) {
            logger.error("[AuthContext] Erreur analytics identify:", err)
          }
        } else {
          hasTrackedSession.current = false
        }
        
        // Toujours passer loading à false après le premier event
        setLoading(false)
      }
    )
    
    // Trigger manuel pour forcer le premier event immédiatement
    // Ceci évite le flash de loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && loading) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }).catch(() => {
      // En cas d'erreur, on met juste loading à false
      // onAuthStateChange prendra le relais
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, createProfileIfNeeded])

  const signOut = useCallback(async () => {
    try {
      // Track logout AVANT de reset
      trackEvent(ANALYTICS_EVENTS.LOGOUT)

      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
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
