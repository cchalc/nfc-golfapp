import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Spinner,
} from '@radix-ui/themes'
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { getInviteInfo, acceptTripInvite, type InviteInfo } from '../server/auth'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/invite/$token')({
  ssr: false,
  component: InvitePage,
})

function InvitePage() {
  const { token } = useParams({ from: '/invite/$token' })
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch invite info
  useEffect(() => {
    async function fetchInvite() {
      try {
        const info = await getInviteInfo({ data: { token } })
        setInviteInfo(info)
      } catch (err) {
        console.error('[Invite] Error fetching invite:', err)
        setInviteInfo({ valid: false })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && inviteInfo?.valid) {
      const redirectUrl = `/invite/${token}`
      navigate({ to: '/login', search: { redirect: redirectUrl } })
    }
  }, [authLoading, isAuthenticated, inviteInfo, token, navigate])

  async function handleAccept() {
    setIsAccepting(true)
    setError(null)

    try {
      const result = await acceptTripInvite({ data: { token } })
      if (result.success) {
        setAccepted(true)
        // Navigate to trip after a moment
        setTimeout(() => {
          navigate({ to: `/trips/${result.tripId}` })
        }, 1500)
      }
    } catch (err: unknown) {
      console.error('[Invite] Error accepting:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsAccepting(false)
    }
  }

  // Loading state
  if (isLoading || authLoading) {
    return (
      <Container size="1" py="9">
        <Flex justify="center" align="center" py="9">
          <Spinner size="3" />
        </Flex>
      </Container>
    )
  }

  // Invalid invite
  if (!inviteInfo?.valid) {
    return (
      <Container size="1" py="9">
        <Card>
          <Flex direction="column" gap="4" p="4" align="center">
            <AlertCircle size={48} style={{ color: 'var(--red-9)' }} />
            <Heading size="5">Invalid Invite</Heading>
            <Text color="gray" align="center">
              {inviteInfo?.expired
                ? 'This invite link has expired.'
                : inviteInfo?.maxUsesReached
                  ? 'This invite link has reached its maximum uses.'
                  : 'This invite link is invalid or has been revoked.'}
            </Text>
            <Button variant="soft" onClick={() => navigate({ to: '/' })}>
              Go Home
            </Button>
          </Flex>
        </Card>
      </Container>
    )
  }

  // Not authenticated - will redirect to login
  if (!isAuthenticated) {
    return (
      <Container size="1" py="9">
        <Flex justify="center" align="center" py="9">
          <Spinner size="3" />
        </Flex>
      </Container>
    )
  }

  // Accepted state
  if (accepted) {
    return (
      <Container size="1" py="9">
        <Card>
          <Flex direction="column" gap="4" p="4" align="center">
            <CheckCircle size={48} style={{ color: 'var(--grass-9)' }} />
            <Heading size="5">You're In!</Heading>
            <Text color="gray" align="center">
              Welcome to {inviteInfo.tripName}. Redirecting to trip...
            </Text>
          </Flex>
        </Card>
      </Container>
    )
  }

  // Accept invite form
  return (
    <Container size="1" py="9">
      <Card>
        <Flex direction="column" gap="5" p="4">
          <Flex direction="column" gap="2" align="center">
            <UserPlus size={32} style={{ color: 'var(--grass-9)' }} />
            <Heading size="6">Join Trip</Heading>
            <Text size="2" color="gray" align="center">
              You've been invited to join
            </Text>
            <Heading size="4" style={{ color: 'var(--amber-9)' }}>
              {inviteInfo.tripName}
            </Heading>
          </Flex>

          {error && (
            <Text size="2" color="red" align="center">
              {error}
            </Text>
          )}

          <Flex direction="column" gap="3">
            <Button size="3" onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? 'Joining...' : 'Join Trip'}
            </Button>
            <Button
              variant="ghost"
              size="2"
              onClick={() => navigate({ to: '/' })}
            >
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Container>
  )
}
