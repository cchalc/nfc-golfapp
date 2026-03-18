import { createFileRoute } from '@tanstack/react-router'
import { Container, Flex, Heading, Button, Dialog } from '@radix-ui/themes'
import { Plus } from 'lucide-react'
import { useLiveQuery } from '@tanstack/react-db'
import { golferCollection } from '../../db/collections'
import { GolferCard } from '../../components/golfers/GolferCard'
import { GolferForm } from '../../components/golfers/GolferForm'
import { EmptyState } from '../../components/ui/EmptyState'

export const Route = createFileRoute('/golfers/')({
  ssr: false,
  component: GolfersPage,
})

function GolfersPage() {
  const { data: golfers, isLoading } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).orderBy(({ golfer }) => golfer.name, 'asc'),
    []
  )

  if (isLoading) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4">
          <Heading size="7">Golfers</Heading>
          <Flex align="center" justify="center" py="9">
            Loading...
          </Flex>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="7">Golfers</Heading>
          <Dialog.Root>
            <Dialog.Trigger>
              <Button color="grass">
                <Plus size={16} />
                Add Golfer
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="400px">
              <Dialog.Title>Add Golfer</Dialog.Title>
              <Dialog.Description size="2" color="gray">
                Add a new golfer to your directory
              </Dialog.Description>
              <Flex direction="column" gap="4" pt="4">
                <GolferForm
                  onSuccess={() => {
                    // Dialog will close automatically via form reset
                    const closeButton = document.querySelector(
                      '[data-radix-dialog-close]'
                    ) as HTMLButtonElement
                    closeButton?.click()
                  }}
                />
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {golfers && golfers.length > 0 ? (
          <Flex direction="column" gap="2">
            {golfers.map((golfer) => (
              <GolferCard key={golfer.id} golfer={golfer} />
            ))}
          </Flex>
        ) : (
          <EmptyState
            title="No golfers yet"
            description="Add golfers to start tracking scores"
            action={
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button color="grass">
                    <Plus size={16} />
                    Add Golfer
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="400px">
                  <Dialog.Title>Add Golfer</Dialog.Title>
                  <Flex direction="column" gap="4" pt="4">
                    <GolferForm />
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            }
          />
        )}
      </Flex>
    </Container>
  )
}
