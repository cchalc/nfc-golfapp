import { Card, Flex, Text, Heading } from '@radix-ui/themes'

interface StatCardProps {
  label: string
  value: string | number
  color?: 'gray' | 'grass' | 'green' | 'red' | 'amber'
  goldAccent?: boolean
}

export function StatCard({ label, value, color = 'gray', goldAccent = false }: StatCardProps) {
  return (
    <Card className={goldAccent ? 'card-gold-hover' : undefined}>
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
