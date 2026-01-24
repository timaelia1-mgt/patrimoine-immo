"use client"

import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Collapsible = ({ open, onOpenChange, children }: CollapsibleProps) => {
  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { open, onOpenChange })
        }
        return child
      })}
    </div>
  )
}

const CollapsibleTrigger = ({ 
  open, 
  onOpenChange, 
  children, 
  className 
}: { 
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div onClick={() => onOpenChange?.(!open)} className={className}>
      {children}
    </div>
  )
}

const CollapsibleContent = ({ 
  open, 
  children, 
  className 
}: { 
  open?: boolean
  children: React.ReactNode
  className?: string
}) => {
  if (!open) return null
  return <div className={className}>{children}</div>
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
