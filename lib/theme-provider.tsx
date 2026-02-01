"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // CRITIQUE : Initialiser le theme avec la valeur de localStorage dès le départ
  // pour éviter un changement de state qui démonterait AuthProvider
  const [theme, setTheme] = useState<Theme>(() => {
    // Lire localStorage immédiatement lors de l'initialisation
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("theme") as Theme
      const initialTheme = saved || "dark" // défaut: dark
      console.log("[ThemeProvider] Initialisation theme:", initialTheme, "(saved:", saved, ")")
      return initialTheme
    }
    return "dark"
  })
  const [mounted, setMounted] = useState(false)

  console.log("[ThemeProvider] Render - theme:", theme, "mounted:", mounted)

  useEffect(() => {
    console.log("[ThemeProvider] useEffect - Initialisation")
    setMounted(true)
    // Appliquer la classe CSS selon le theme actuel (déjà initialisé)
    // Ne PAS changer le state ici pour éviter de démonter AuthProvider
    document.documentElement.classList.toggle("dark", theme === "dark")
    console.log("[ThemeProvider] Classe CSS appliquée pour theme:", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    console.log("[ThemeProvider] toggleTheme appelé")
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light"
      console.log("[ThemeProvider] Changement de theme:", prevTheme, "->", newTheme)
      localStorage.setItem("theme", newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
      return newTheme
    })
  }, [])

  // CRITIQUE : Mémoriser l'objet value pour éviter les re-renders en cascade
  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  )

  if (!mounted) {
    console.log("[ThemeProvider] Pas encore monté, retour des children sans Provider")
    return <>{children}</>
  }

  console.log("[ThemeProvider] Rendu avec Provider - value:", contextValue)
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
