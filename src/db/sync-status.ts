import { createCollection, localOnlyCollectionOptions } from '@tanstack/react-db'
import { z } from 'zod'

/**
 * Schema for sync status state.
 * Tracks online/offline status and pending changes.
 */
export const syncStatusSchema = z.object({
  id: z.literal('singleton'),
  isOnline: z.boolean(),
  pendingCount: z.number(),
  lastSyncError: z.string().nullable(),
  lastSyncAt: z.date().nullable(),
})

export type SyncStatus = z.output<typeof syncStatusSchema>

/**
 * Local-only collection for tracking sync status.
 * Not synced to server - purely for UI state.
 */
export const syncStatusCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: () => 'singleton',
    schema: syncStatusSchema,
    initialData: [
      {
        id: 'singleton' as const,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        pendingCount: 0,
        lastSyncError: null,
        lastSyncAt: null,
      },
    ],
  })
)

/**
 * Update the sync status.
 */
export function updateSyncStatus(updates: Partial<Omit<SyncStatus, 'id'>>) {
  syncStatusCollection.update('singleton', (draft) => {
    if (updates.isOnline !== undefined) draft.isOnline = updates.isOnline
    if (updates.pendingCount !== undefined) draft.pendingCount = updates.pendingCount
    if (updates.lastSyncError !== undefined) draft.lastSyncError = updates.lastSyncError
    if (updates.lastSyncAt !== undefined) draft.lastSyncAt = updates.lastSyncAt
  })
}

/**
 * Initialize online/offline event listeners.
 * Call this once at app startup.
 */
export function initSyncStatusListeners() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    updateSyncStatus({ isOnline: true })
    console.log('[SyncStatus] Online')
  })

  window.addEventListener('offline', () => {
    updateSyncStatus({ isOnline: false })
    console.log('[SyncStatus] Offline')
  })
}
