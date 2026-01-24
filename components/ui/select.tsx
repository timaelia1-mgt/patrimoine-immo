"use client"

import * as React from "react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const Select = ({ value, onValueChange, children, defaultValue }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const actualValue = value !== undefined ? value : internalValue
  
  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <SelectContext.Provider value={{ value: actualValue, onValueChange: handleChange }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  const { value } = React.useContext(SelectContext)
  
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
        {...props}
      >
        {children}
      </select>
    </div>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = () => null

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const SelectItem = ({ 
  value, 
  children 
}: { 
  value: string
  children: React.ReactNode
}) => {
  return <option value={value}>{children}</option>
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
