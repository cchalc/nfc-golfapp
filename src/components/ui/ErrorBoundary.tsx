import { Component, ReactNode } from 'react'
import { Container, Flex, Text, Button, Callout } from '@radix-ui/themes'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Container size="2" py="9">
          <Callout.Root color="red">
            <Callout.Icon>
              <AlertTriangle size={18} />
            </Callout.Icon>
            <Callout.Text>
              <Flex direction="column" gap="3">
                <Text weight="bold">Something went wrong</Text>
                <Text size="2">{this.state.error?.message}</Text>
                <Button
                  size="1"
                  variant="soft"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw size={14} /> Reload Page
                </Button>
              </Flex>
            </Callout.Text>
          </Callout.Root>
        </Container>
      )
    }
    return this.props.children
  }
}
