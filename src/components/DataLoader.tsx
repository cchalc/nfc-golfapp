import { useEffect } from 'react'
import { initOffline } from '../db/offline'
import { initSyncStatusListeners } from '../db/sync-status'
import { TripWarmupManager } from './trips/TripWarmupManager'

/**
 * DataLoader component.
 *
 * Initializes offline transaction support on app start.
 * Electric shapes automatically populate collections from the database.
 */
export function DataLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Initialize sync status listeners (online/offline events)
    initSyncStatusListeners()

    initOffline()
      .then(() => {
        console.log('[DataLoader] Offline support initialized')
      })
      .catch((error) => {
        console.error('[DataLoader] Failed to initialize offline support:', error)
      })
  }, [])

  // Render children immediately - init and warmup happen in background
  return (
    <>
      <TripWarmupManager />
      {children}
    </>
  )
}
