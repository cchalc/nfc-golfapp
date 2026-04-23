// src/components/ui/StatCard.tsx
import { Card, Flex, Text, Heading } from '@radix-ui/themes'

interface StatCardProps {
  label: string
  value: string | number
  color?: 'gray' | 'grass' | 'green' | 'red' | 'amber'
}

export function StatCard({ label, value, color = 'gray' }: StatCardProps) {
  return (
    <Card className="hover-lift">
      <Flex direction="column" gap="2">
        <Text size="1" color="gray">
          {label}
        </Text>
        <Heading size="6" color={color}>
          {value}
        </Heading>
      </Flex>
    </Card>
  )
}
