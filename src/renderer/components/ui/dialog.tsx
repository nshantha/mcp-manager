import React from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black opacity-50" 
          onClick={() => onOpenChange(false)}
        />
        
        {/* Dialog content */}
        <div className="relative" style={{ zIndex: 10000 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`
      relative bg-white 
      rounded-lg shadow-xl border
      p-6 
      max-w-2xl w-full
      max-h-[90vh] overflow-y-auto
      ${className}
    `} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="mb-6">
      {children}
    </div>
  )
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps {
  children: React.ReactNode
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-muted-foreground mt-2">
      {children}
    </p>
  )
}