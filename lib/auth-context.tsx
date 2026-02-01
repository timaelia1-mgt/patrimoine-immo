"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { User, Session } from "@supabase/supabase-js"
import { createClient } from "./supabase/client"
import { createUserProfile, getUserProfile } from "./database"

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
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let initAuthCompleted = false

    console.log("[AuthContext] useEffect déclenché")

    // Fonction async pour initialiser l'authentification
    const initAuth = async () => {
      try {
        console.log("[AuthContext] initAuth() - Début getSession()")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) {
          console.log("[AuthContext] initAuth() - Composant démonté, arrêt")
          return
        }
        
        if (error) {
          console.error("[AuthContext] Erreur getSession:", error)
          setSession(null)
          setUser(null)
          initAuthCompleted = true
          setLoading(false)
          return
        }
        
        console.log("[AuthContext] Session récupérée:", session?.user?.id || "null")
        setSession(session)
        setUser(session?.user ?? null)
        
        // Créer le profil si l'utilisateur existe mais n'a pas de profil
        if (session?.user) {
          console.log("[AuthContext] Création profil si nécessaire...")
          await createProfileIfNeeded(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata?.name
          )
          console.log("[AuthContext] Profil vérifié/créé")
        }
        
        initAuthCompleted = true
        console.log("[AuthContext] initAuth() terminé avec succès")
      } catch (error) {
        console.error("[AuthContext] Erreur lors de l'initialisation:", error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          initAuthCompleted = true
        }
      } finally {
        // CRITIQUE : toujours définir loading à false
        if (isMounted) {
          console.log("[AuthContext] setLoading(false) - Initialisation terminée")
          setLoading(false)
        }
      }
    }

    // Initialiser l'authentification
    initAuth()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      console.log("[AuthContext] Auth state changed:", _event, session?.user?.id || "null")
      
      // Ne mettre à jour que si initAuth n'a pas encore terminé
      // Sinon, onAuthStateChange peut se déclencher avant initAuth et causer des problèmes
      if (!initAuthCompleted) {
        console.log("[AuthContext] initAuth pas encore terminé, onAuthStateChange ignoré temporairement")
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      // Créer le profil si l'utilisateur existe mais n'a pas de profil
      if (session?.user) {
        await createProfileIfNeeded(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata?.name
        )
      }
      
      // Mettre à jour loading si nécessaire
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      console.log("[AuthContext] Cleanup")
      isMounted = false
      subscription.unsubscribe()
    }
  }, [createProfileIfNeeded, supabase]) // supabase est maintenant stable grâce à useMemo

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[AuthContext] Erreur lors de la déconnexion:", error)
        throw error
      }
      setUser(null)
      setSession(null)
      console.log("[AuthContext] Déconnexion réussie")
    } catch (error) {
      console.error("[AuthContext] Erreur dans signOut:", error)
      // Nettoyer l'état même en cas d'erreur
      setUser(null)
      setSession(null)
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
