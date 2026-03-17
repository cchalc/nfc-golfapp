import { Card, Flex, Text, Heading } from '@radix-ui/themes'

interface StatCardProps {
  label: string
  value: string | number
  color?: 'gray' | 'blue' | 'green' | 'red' | 'amber'
}

export function StatCard({ label, value, color = 'gray' }: StatCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="1">
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
