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

    console.log("[AuthContext] useEffect déclenché")

    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      
      console.log("[AuthContext] Session récupérée:", session?.user?.id || "null")
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
      
      setLoading(false)
      console.log("[AuthContext] Loading mis à false")
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      console.log("[AuthContext] Auth state changed:", _event, session?.user?.id || "null")
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
      
      setLoading(false)
    })

    return () => {
      console.log("[AuthContext] Cleanup")
      isMounted = false
      subscription.unsubscribe()
    }
  }, [createProfileIfNeeded, supabase]) // supabase est maintenant stable grâce à useMemo

  const signOut = async () => {
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
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
