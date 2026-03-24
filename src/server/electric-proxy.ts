import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'

/**
 * Create a proxy handler for Electric shape requests.
 * Forwards Electric protocol params and injects server-side credentials.
 */
export function createElectricProxyHandler(tableName: string) {
  return async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const electricUrl = process.env.ELECTRIC_URL || 'http://localhost:3000'
    const origin = new URL(`${electricUrl}/v1/shape`)

    // Forward Electric protocol params (offset, handle, live, etc.)
    url.searchParams.forEach((v, k) => {
      if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(k)) {
        origin.searchParams.set(k, v)
      }
    })

    // Set the table name
    origin.searchParams.set('table', tableName)

    // Add auth if using Electric Cloud
    if (process.env.ELECTRIC_SOURCE_ID) {
      origin.searchParams.set('source_id', process.env.ELECTRIC_SOURCE_ID)
    }
    if (process.env.ELECTRIC_SECRET) {
      origin.searchParams.set('secret', process.env.ELECTRIC_SECRET)
    }

    const res = await fetch(origin)

    // Create response with headers, removing encoding headers that cause issues
    const headers = new Headers(res.headers)
    headers.delete('content-encoding')
    headers.delete('content-length')

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    })
  }
}
