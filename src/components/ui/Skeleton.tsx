import { Skeleton, Card, Flex } from '@radix-ui/themes'

export function CardSkeleton() {
  return (
    <Card>
      <Flex direction="column" gap="2" p="3">
        <Skeleton width="60%" height="20px" />
        <Skeleton width="40%" height="16px" />
      </Flex>
    </Card>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Flex gap="3" py="2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} width="80px" height="16px" />
      ))}
    </Flex>
  )
}

export function StatCardSkeleton() {
  return (
    <Card>
      <Flex direction="column" align="center" gap="2" py="3">
        <Skeleton width="40px" height="28px" />
        <Skeleton width="60px" height="14px" />
      </Flex>
    </Card>
  )
}
