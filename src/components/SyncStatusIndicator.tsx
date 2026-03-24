import { useLiveQuery } from '@tanstack/react-db'
import { Flex, Tooltip, Badge } from '@radix-ui/themes'
import { WifiOff, Cloud, AlertCircle } from 'lucide-react'
import { syncStatusCollection, type SyncStatus } from '../db/sync-status'

/**
 * Visual indicator for sync status.
 * Shows online/offline state, pending changes count, and sync errors.
 */
export function SyncStatusIndicator() {
  const results = useLiveQuery((query) =>
    query.from({ syncStatus: syncStatusCollection })
  )

  const syncStatus: SyncStatus | undefined = results?.data?.[0]

  if (!syncStatus) return null

  const { isOnline, pendingCount, lastSyncError } = syncStatus

  // Determine status color and icon
  let statusColor: 'green' | 'yellow' | 'red' | 'gray' = 'gray'
  let StatusIcon = Cloud

  if (!isOnline) {
    statusColor = 'yellow'
    StatusIcon = WifiOff
  } else if (lastSyncError) {
    statusColor = 'red'
    StatusIcon = AlertCircle
  } else if (pendingCount > 0) {
    statusColor = 'yellow'
    StatusIcon = Cloud
  } else {
    statusColor = 'green'
    StatusIcon = Cloud
  }

  // Build tooltip content
  let tooltipContent = isOnline ? 'Online' : 'Offline'
  if (pendingCount > 0) {
    tooltipContent += ` - ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
  }
  if (lastSyncError) {
    tooltipContent += ` - Error: ${lastSyncError}`
  }

  return (
    <Tooltip content={tooltipContent}>
      <Flex align="center" gap="1" style={{ cursor: 'help' }}>
        <StatusIcon
          size={16}
          style={{
            color: `var(--${statusColor}-9)`,
          }}
        />
        {pendingCount > 0 && (
          <Badge size="1" color={statusColor} variant="soft">
            {pendingCount}
          </Badge>
        )}
      </Flex>
    </Tooltip>
  )
}
