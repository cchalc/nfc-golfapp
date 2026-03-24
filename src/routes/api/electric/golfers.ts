import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/golfers')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('golfers'),
    },
  },
})
