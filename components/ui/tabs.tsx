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
  defaultValue: string
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 gap-1",
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
          ? "bg-white text-slate-950 shadow-sm" 
          : "hover:bg-slate-200",
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
  children 
}: { 
  value: string
  children: React.ReactNode
}) {
  const { value } = React.useContext(TabsContext)
  
  if (value !== contentValue) return null
  
  return <div className="mt-2">{children}</div>
}
