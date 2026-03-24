import { useCallback } from 'react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { uiStateCollection } from '../db/collections'

/**
 * Hook to manage dialog open state via TanStack DB collection.
 * This allows dialogs to close properly after form submission.
 *
 * @param dialogId - Unique identifier for this dialog instance
 * @returns [isOpen, setOpen] tuple
 */
export function useDialogState(dialogId: string): [boolean, (open: boolean) => void] {
  const { data: uiStates } = useLiveQuery(
    (q) =>
      q.from({ ui: uiStateCollection }).where(({ ui }) => eq(ui.dialogId, dialogId)),
    [dialogId]
  )

  const uiState = uiStates?.[0]
  const isOpen = uiState?.isOpen ?? false

  // Use useCallback to stabilize the function reference and query fresh from
  // the collection to avoid stale closure issues with Electric's async sync
  const setOpen = useCallback(
    (open: boolean) => {
      // Query the collection directly to get fresh state
      const entries = [...uiStateCollection]
      const existing = entries.find(([, s]) => s.dialogId === dialogId)

      if (existing) {
        uiStateCollection.update(existing[0], (d) => {
          d.isOpen = open
        })
      } else {
        uiStateCollection.insert({
          id: crypto.randomUUID(),
          dialogId,
          isOpen: open,
        })
      }
    },
    [dialogId]
  )

  return [isOpen, setOpen]
}
