import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Container, Flex, Heading } from '@radix-ui/themes'
import { TripForm } from '../../components/trips/TripForm'
import { useRequireAuth } from '../../hooks/useRequireAuth'

export const Route = createFileRoute('/trips/new')({
  ssr: false,
  component: NewTripPage,
})

function NewTripPage() {
  useRequireAuth()
  const navigate = useNavigate()

  return (
    <Container size="1" py="6">
      <Flex direction="column" gap="5">
        <Heading size="7">New Trip</Heading>
        <TripForm
          onSuccess={() => {
            navigate({ to: '/trips' })
          }}
        />
      </Flex>
    </Container>
  )
}
