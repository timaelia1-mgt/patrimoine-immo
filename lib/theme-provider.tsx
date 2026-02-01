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
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  console.log("[ThemeProvider] Render - theme:", theme, "mounted:", mounted)

  useEffect(() => {
    console.log("[ThemeProvider] useEffect - Initialisation")
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as Theme
    if (savedTheme) {
      console.log("[ThemeProvider] Theme sauvegardé trouvé:", savedTheme)
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      console.log("[ThemeProvider] Pas de theme sauvegardé, utilisation du défaut")
    }
  }, [])

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
