import { useLiveQuery } from '@tanstack/react-db'
import { Badge, Flex, Tooltip } from '@radix-ui/themes'
import { AlertCircle, Cloud, CloudCog, WifiOff } from 'lucide-react'
import { syncStatusCollection, type SyncStatus } from '../db/sync-status'

/**
 * Visual indicator for sync status.
 * Shows online/offline state, syncing state, pending changes count, and sync errors.
 *
 * States:
 * - Synced: Green cloud with checkmark - "All changes saved"
 * - Syncing: Blue spinning cloud - "Syncing X changes..."
 * - Offline: Yellow wifi-off - "Offline - changes saved locally"
 * - Pending: Yellow cloud with badge - "X changes waiting to sync"
 * - Error: Red alert - "Sync error - tap to retry"
 */
export function SyncStatusIndicator() {
  const results = useLiveQuery((query) =>
    query.from({ syncStatus: syncStatusCollection })
  )

  const syncStatus: SyncStatus | undefined = results?.data?.[0]

  if (!syncStatus) return null

  const { isOnline, isSyncing, pendingCount, lastSyncError } = syncStatus

  // Determine status color, icon, and tooltip
  let statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' = 'gray'
  let StatusIcon = Cloud
  let tooltipContent = 'All changes saved'
  let shouldSpin = false

  if (!isOnline) {
    // Offline state takes precedence
    statusColor = 'yellow'
    StatusIcon = WifiOff
    tooltipContent = 'Offline - changes saved locally'
  } else if (lastSyncError) {
    // Error state
    statusColor = 'red'
    StatusIcon = AlertCircle
    tooltipContent = 'Sync error - tap to retry'
  } else if (isSyncing) {
    // Actively syncing
    statusColor = 'blue'
    StatusIcon = CloudCog
    shouldSpin = true
    tooltipContent =
      pendingCount > 0
        ? `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}...`
        : 'Syncing...'
  } else if (pendingCount > 0) {
    // Pending changes waiting to sync
    statusColor = 'yellow'
    StatusIcon = Cloud
    tooltipContent = `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync`
  } else {
    // All synced
    statusColor = 'green'
    StatusIcon = Cloud
    tooltipContent = 'All changes saved'
  }

  return (
    <Tooltip content={tooltipContent}>
      <Flex align="center" gap="1" style={{ cursor: 'help' }}>
        <StatusIcon
          size={16}
          style={{
            color: `var(--${statusColor}-9)`,
            animation: shouldSpin ? 'spin 1s linear infinite' : undefined,
          }}
        />
        {pendingCount > 0 && !isSyncing && (
          <Badge size="1" color={statusColor} variant="soft">
            {pendingCount}
          </Badge>
        )}
      </Flex>
    </Tooltip>
  )
}
