import { createFileRoute } from '@tanstack/react-router'
import { createElectricProxyHandler } from '../../../server/electric-proxy'

export const Route = createFileRoute('/api/electric/tee-boxes')({
  server: {
    handlers: {
      GET: createElectricProxyHandler('tee_boxes'),
    },
  },
})
