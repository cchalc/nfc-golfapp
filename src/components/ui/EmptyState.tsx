import { Flex, Text, Heading } from '@radix-ui/themes'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" gap="3" py="9">
      <Heading size="5" color="gray">
        {title}
      </Heading>
      {description && (
        <Text size="2" color="gray">
          {description}
        </Text>
      )}
      {action}
    </Flex>
  )
}
