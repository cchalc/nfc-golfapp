import { Children, type ReactNode, type CSSProperties } from 'react'

interface AnimatedListProps {
  children: ReactNode
  staggerMs?: number
  className?: string
}

export function AnimatedList({ children, staggerMs = 50, className }: AnimatedListProps) {
  return (
    <>
      {Children.map(children, (child, index) => (
        <div
          className={`stagger-item ${className || ''}`}
          style={{ '--stagger-index': index } as CSSProperties}
        >
          {child}
        </div>
      ))}
    </>
  )
}
