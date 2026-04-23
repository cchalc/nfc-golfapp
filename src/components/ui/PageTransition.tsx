// src/components/ui/PageTransition.tsx
import { type ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="animate-reveal">{children}</div>
}
