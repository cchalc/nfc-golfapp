import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/challenges')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('challenges'),
    },
  },
})
