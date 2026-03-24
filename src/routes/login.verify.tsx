import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Card,
  Link,
} from '@radix-ui/themes'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { verifyMagicLink, requestMagicLink } from '../server/auth'
import { useAuth } from '../contexts/AuthContext'

interface SearchParams {
  email?: string
  redirect?: string
}

export const Route = createFileRoute('/login/verify')({
  ssr: false,
  component: VerifyPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    email: (search.email as string) || '',
    redirect: (search.redirect as string) || '/',
  }),
})

const CODE_LENGTH = 6
const EXPIRY_SECONDS = 15 * 60 // 15 minutes

function VerifyPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login/verify' })
  const { refresh } = useAuth()

  const email = search.email || ''
  const redirectTo = search.redirect || '/'

  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS)
  const inputRef = useRef<HTMLInputElement>(null)

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  // If no email, redirect to login
  useEffect(() => {
    if (!email) {
      navigate({ to: '/login' })
    }
  }, [email, navigate])

  // Format code as user types (uppercase, strip non-alphanumeric)
  function handleCodeChange(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(cleaned.slice(0, CODE_LENGTH))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (code.length !== CODE_LENGTH) {
      setError(`Code must be ${CODE_LENGTH} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await verifyMagicLink({ data: { email, code } })

      if (!result.success) {
        setError(result.error || 'Invalid code')
        return
      }

      // Set the cookie if provided
      if (result.setCookie) {
        document.cookie = result.setCookie
      }

      // Refresh auth context
      await refresh()

      // Redirect to destination
      navigate({ to: redirectTo })
    } catch (err) {
      console.error('[Verify] Error:', err)
      setError('Failed to verify code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    setError(null)

    try {
      await requestMagicLink({ data: { email } })
      setSecondsLeft(EXPIRY_SECONDS)
      setCode('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('[Resend] Error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isExpired = secondsLeft === 0

  return (
    <Container size="1" py="9">
      <Card>
        <Flex direction="column" gap="5" p="4">
          <Flex direction="column" gap="2" align="center">
            <KeyRound size={32} style={{ color: 'var(--grass-9)' }} />
            <Heading size="6">Enter Code</Heading>
            <Text size="2" color="gray" align="center">
              We sent a 6-character code to
              <br />
              <Text weight="medium">{email}</Text>
            </Text>
          </Flex>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text as="label" size="2" weight="medium">
                    Code
                  </Text>
                  <Text size="1" color={isExpired ? 'red' : 'gray'}>
                    {isExpired ? 'Expired' : `Expires in ${formatTime(secondsLeft)}`}
                  </Text>
                </Flex>
                <TextField.Root
                  ref={inputRef}
                  type="text"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={isSubmitting || isExpired}
                  autoComplete="one-time-code"
                  autoFocus
                  size="3"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                  }}
                />
              </Flex>

              {error && (
                <Text size="2" color="red">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                size="3"
                disabled={isSubmitting || code.length !== CODE_LENGTH || isExpired}
              >
                {isSubmitting ? 'Verifying...' : 'Sign In'}
              </Button>

              <Flex direction="column" gap="2" align="center">
                <Button
                  type="button"
                  variant="ghost"
                  size="2"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend code'}
                </Button>

                <Link href="/login" size="2">
                  <Flex align="center" gap="1">
                    <ArrowLeft size={14} />
                    Use different email
                  </Flex>
                </Link>
              </Flex>
            </Flex>
          </form>
        </Flex>
      </Card>
    </Container>
  )
}
