import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/trip-invites')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('trip_invites'),
    },
  },
})
