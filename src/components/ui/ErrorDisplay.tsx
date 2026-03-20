import { Callout, Button, Flex } from '@radix-ui/themes'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorDisplay({ message, onRetry }: Props) {
  return (
    <Callout.Root color="red" size="1">
      <Callout.Icon>
        <AlertCircle size={16} />
      </Callout.Icon>
      <Callout.Text>
        <Flex align="center" gap="3" justify="between">
          {message}
          {onRetry && (
            <Button size="1" variant="ghost" onClick={onRetry}>
              <RefreshCw size={12} /> Retry
            </Button>
          )}
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}
