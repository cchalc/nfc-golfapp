import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/scores')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('scores'),
    },
  },
})
