import { createFileRoute, useNavigate, Outlet, useMatch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Card,
} from '@radix-ui/themes'
import { Mail } from 'lucide-react'
import { requestMagicLink } from '../server/auth'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/login')({
  ssr: false,
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if we're at the exact /login path or a child route
  const loginMatch = useMatch({ from: '/login', shouldThrow: false })
  const isExactLoginPath = loginMatch !== undefined && !window.location.pathname.includes('/verify')

  // Get redirect param from URL
  const searchParams = new URLSearchParams(window.location.search)
  const redirectTo = searchParams.get('redirect') || '/'

  // If already authenticated, redirect (in useEffect to avoid render loop)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: redirectTo })
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo])

  // Show nothing while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return <Outlet />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      await requestMagicLink({ data: { email: trimmedEmail } })
      // Navigate to verify page with email
      navigate({
        to: '/login/verify',
        search: { email: trimmedEmail, redirect: redirectTo },
      })
    } catch (err) {
      console.error('[Login] Error:', err)
      setError('Failed to send login code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If at a child route (like /login/verify), render the child
  if (!isExactLoginPath) {
    return <Outlet />
  }

  return (
    <Container size="1" py="9">
      <Card>
        <Flex direction="column" gap="5" p="4">
          <Flex direction="column" gap="2" align="center">
            <Mail size={32} style={{ color: 'var(--grass-9)' }} />
            <Heading size="6">Sign In</Heading>
            <Text size="2" color="gray">
              Enter your email to receive a login code
            </Text>
          </Flex>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Text as="label" size="2" weight="medium">
                  Email
                </Text>
                <TextField.Root
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                  size="3"
                />
              </Flex>

              {error && (
                <Text size="2" color="red">
                  {error}
                </Text>
              )}

              <Button type="submit" size="3" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Login Code'}
              </Button>
            </Flex>
          </form>
        </Flex>
      </Card>
    </Container>
  )
}
