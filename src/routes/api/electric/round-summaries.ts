import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/round-summaries')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('round_summaries'),
    },
  },
})
