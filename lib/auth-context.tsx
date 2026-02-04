"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { User, Session } from "@supabase/supabase-js"
import { createClient } from "./supabase/client"
import { createUserProfile, getUserProfile } from "./database"
import { logger } from "./logger"
import { toast } from "sonner"

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
    
    console.log('[AuthContext DEBUG] useEffect démarré - version simplifiée')

    // UN SEUL listener pour TOUT gérer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          console.log('[AuthContext DEBUG] Composant démonté, arrêt')
          return
        }
        
        console.log('[AuthContext DEBUG] Auth event:', event, 'session:', !!session)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Créer le profil si nécessaire
        if (session?.user) {
          console.log('[AuthContext DEBUG] Création profil pour user:', session.user.id)
          try {
            await createProfileIfNeeded(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.name
            )
            console.log('[AuthContext DEBUG] Profil créé/vérifié')
          } catch (err) {
            console.error('[AuthContext DEBUG] Erreur profil:', err)
          }
        }
        
        // Toujours passer loading à false après le premier event
        console.log('[AuthContext DEBUG] setLoading(false)')
        setLoading(false)
      }
    )
    
    // Trigger manuel pour forcer le premier event immédiatement
    // Ceci évite le flash de loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && loading) {
        console.log('[AuthContext DEBUG] Session initiale récupérée:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }).catch(() => {
      // En cas d'erreur, on met juste loading à false
      // onAuthStateChange prendra le relais
      if (isMounted) {
        console.log('[AuthContext DEBUG] Erreur getSession ignorée, onAuthStateChange prendra le relais')
        setLoading(false)
      }
    })

    return () => {
      console.log('[AuthContext DEBUG] Cleanup')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, createProfileIfNeeded, loading])

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        logger.error("[AuthContext] Erreur lors de la déconnexion:", error)
        throw error
      }
      setUser(null)
      setSession(null)
      toast.success('Déconnexion réussie')
      // Redirection vers login avec force reload pour nettoyer l'état
      window.location.href = '/login'
    } catch (error: unknown) {
      logger.error("[AuthContext] Erreur dans signOut:", error)
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
