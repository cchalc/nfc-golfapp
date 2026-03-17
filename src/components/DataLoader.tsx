import { useEffect, useRef } from 'react'
import { useLiveQuery, count } from '@tanstack/react-db'
import { golferCollection } from '../db/collections'
import { seedData } from '../db/seed'

export function DataLoader({ children }: { children: React.ReactNode }) {
  const hasSeeded = useRef(false)

  const { data: golferCount, isLoading } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).select(({ golfer }) => ({
        total: count(golfer.id),
      })),
    []
  )

  useEffect(() => {
    if (isLoading || hasSeeded.current) return

    const total = golferCount?.[0]?.total ?? 0

    if (total === 0) {
      hasSeeded.current = true
      seedData()
    }
  }, [golferCount, isLoading])

  return <>{children}</>
}
