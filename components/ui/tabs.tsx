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

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const value = controlledValue ?? internalValue
  
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [controlledValue, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ 
  className, 
  children 
}: { 
  className?: string
  children: React.ReactNode 
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-start w-full gap-1 p-1.5",
        "bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm",
        "border-b border-slate-800/50 relative",
        className
      )}
    >
      {children}
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
    </div>
  )
}

export function TabsTrigger({
  value: triggerValue,
  children,
  className,
  disabled = false,
}: {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isActive = value === triggerValue

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5",
        "text-sm font-medium tracking-tight transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "text-amber-400 shadow-lg shadow-amber-500/10"
          : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50",
        className
      )}
      onClick={() => !disabled && onValueChange(triggerValue)}
    >
      {/* Background gradient for active tab */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 animate-in fade-in duration-300" />
      )}
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
      
      {/* Active indicator - animated border bottom */}
      {isActive && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-in slide-in-from-bottom-2 duration-300" />
      )}
    </button>
  )
}

export function TabsContent({
  value: contentValue,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { value } = React.useContext(TabsContext)
  
  if (value !== contentValue) {
    return null
  }

  return (
    <div
      className={cn(
        "mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500",
        className
      )}
    >
      {children}
    </div>
  )
}
