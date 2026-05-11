"use client"

import * as React from "react"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
}

export type ToastActionElement = React.ReactNode

// Minimal toast component - placeholder for shadcn/ui toast
// Install full component via: npx shadcn@latest add toast
export function Toast({ title, description, ...props }: ToastProps) {
  return null
}

export default Toast
