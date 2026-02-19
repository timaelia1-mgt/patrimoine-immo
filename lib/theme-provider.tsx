'use client'
import { createContext, useContext, ReactNode } from 'react'

const ThemeContext = createContext({ theme: 'dark' as const })

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Forcer dark mode dans le HTML dès le chargement
  if (typeof window !== 'undefined') {
    document.documentElement.classList.add('dark')
  }
  
  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
