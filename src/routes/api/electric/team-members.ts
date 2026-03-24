import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/team-members')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('team_members'),
    },
  },
})
