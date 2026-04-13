import { useState, useCallback } from 'react'

/**
 * Hook to manage dialog open state with simple React state.
 *
 * @param _dialogId - Unique identifier for this dialog instance (unused, kept for API compatibility)
 * @returns [isOpen, setOpen] tuple
 */
export function useDialogState(_dialogId: string): [boolean, (open: boolean) => void] {
  const [isOpen, setIsOpen] = useState(false)

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  return [isOpen, setOpen]
}
