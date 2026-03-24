import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/challenge-results')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('challenge_results'),
    },
  },
})
