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

  const setOpen = (open: boolean) => {
    if (uiState) {
      // Update existing state
      uiStateCollection.update(uiState.id, (d) => {
        d.isOpen = open
      })
    } else {
      // Create new state entry
      uiStateCollection.insert({
        id: crypto.randomUUID(),
        dialogId,
        isOpen: open,
      })
    }
  }

  return [isOpen, setOpen]
}
