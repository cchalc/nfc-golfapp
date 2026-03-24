import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/trips')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('trips'),
    },
  },
})
