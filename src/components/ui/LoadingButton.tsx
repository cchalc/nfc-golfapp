import { Button, Spinner, type ButtonProps } from '@radix-ui/themes'
import { type ReactNode } from 'react'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  children: ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={disabled || loading} className="button-press">
      {loading ? (
        <>
          <Spinner size="1" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
