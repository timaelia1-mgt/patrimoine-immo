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
    
    console.log('[AuthContext DEBUG] useEffect démarré')

    // Listener pour les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          console.log('[AuthContext DEBUG] Composant démonté, arrêt')
          return
        }
        
        console.log('[AuthContext DEBUG] onAuthStateChange:', event, 'session:', !!session)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Créer le profil si nécessaire
        if (session?.user) {
          console.log('[AuthContext DEBUG] Création profil pour user:', session.user.id)
          await createProfileIfNeeded(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata?.name
          )
          console.log('[AuthContext DEBUG] Profil créé/vérifié')
        }
        
        console.log('[AuthContext DEBUG] setLoading(false) depuis onAuthStateChange')
        setLoading(false)
      }
    )

    // Check initial de la session (évite le flash)
    console.log('[AuthContext DEBUG] Appel getSession() initial')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthContext DEBUG] getSession() résultat:', { session: !!session, error })
      
      if (!isMounted) {
        console.log('[AuthContext DEBUG] Composant démonté après getSession')
        return
      }
      
      if (error) {
        console.error('[AuthContext DEBUG] Erreur getSession:', error)
        setLoading(false)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      // Créer le profil si nécessaire
      if (session?.user) {
        console.log('[AuthContext DEBUG] Création profil initial pour user:', session.user.id)
        createProfileIfNeeded(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata?.name
        ).then(() => {
          console.log('[AuthContext DEBUG] Profil initial créé/vérifié')
          if (isMounted) {
            console.log('[AuthContext DEBUG] setLoading(false) après profil initial')
            setLoading(false)
          }
        }).catch((err) => {
          console.error('[AuthContext DEBUG] Erreur création profil:', err)
          if (isMounted) {
            console.log('[AuthContext DEBUG] setLoading(false) après erreur profil')
            setLoading(false)
          }
        })
      } else {
        console.log('[AuthContext DEBUG] Pas de session, setLoading(false)')
        setLoading(false)
      }
    }).catch((err) => {
      console.error('[AuthContext DEBUG] Erreur catch getSession:', err)
      if (isMounted) {
        console.log('[AuthContext DEBUG] setLoading(false) après erreur getSession')
        setLoading(false)
      }
    })

    return () => {
      console.log('[AuthContext DEBUG] Cleanup')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, createProfileIfNeeded])

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
