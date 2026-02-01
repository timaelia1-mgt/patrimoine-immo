"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType>({
  value: "",
  onValueChange: () => {},
})

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  
  // Utiliser la valeur contrôlée si fournie, sinon utiliser l'état interne
  const value = controlledValue !== undefined ? controlledValue : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 gap-1 border-b border-slate-200 dark:border-slate-700",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ 
  value: triggerValue, 
  children, 
  className 
}: { 
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isActive = value === triggerValue

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
        "text-sm font-medium transition-all",
        isActive 
          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border-b-2 border-sky-500" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
      onClick={() => onValueChange(triggerValue)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ 
  value: contentValue, 
  children,
  className
}: { 
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { value } = React.useContext(TabsContext)
  
  if (value !== contentValue) return null
  
  return <div className={cn("mt-2", className)}>{children}</div>
}
