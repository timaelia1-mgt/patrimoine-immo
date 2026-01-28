"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
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

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Créer le profil si l'utilisateur existe mais n'a pas de profil
      if (session?.user) {
        try {
          const profile = await getUserProfile(session.user.id)
          if (!profile) {
            await createUserProfile(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.name
            )
          }
        } catch (error) {
          console.error("Erreur lors de la création du profil:", error)
        }
      }
      
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Créer le profil si l'utilisateur existe mais n'a pas de profil
      if (session?.user) {
        try {
          const profile = await getUserProfile(session.user.id)
          if (!profile) {
            await createUserProfile(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.name
            )
          }
        } catch (error) {
          console.error("Erreur lors de la création du profil:", error)
        }
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
