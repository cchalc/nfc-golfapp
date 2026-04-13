import { AlertDialog, Button, Flex } from '@radix-ui/themes'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteRound, useScoresByRoundId } from '../../hooks/queries'
import type { Round } from '../../db/collections'

interface RoundDeleteButtonProps {
  round: Round
  courseName: string
  tripId: string
}

export function RoundDeleteButton({
  round,
  courseName,
  tripId,
}: RoundDeleteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: scores, isLoading } = useScoresByRoundId(round.id)
  const deleteRound = useDeleteRound()

  const hasScores = scores && scores.length > 0

  function handleDelete() {
    deleteRound.mutate({ id: round.id, tripId })
    setDialogOpen(false)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (hasScores) {
      setDialogOpen(true)
    } else {
      handleDelete()
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="1"
        color="red"
        onClick={handleDeleteClick}
        disabled={isLoading || deleteRound.isPending}
      >
        <Trash2 size={14} />
      </Button>
      <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Delete Round</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to delete Round {round.roundNumber} at{' '}
            {courseName}? This will permanently remove all golfer scores for
            this round.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                variant="solid"
                color="red"
                onClick={handleDelete}
                disabled={deleteRound.isPending}
              >
                {deleteRound.isPending ? 'Deleting...' : 'Delete Round'}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
