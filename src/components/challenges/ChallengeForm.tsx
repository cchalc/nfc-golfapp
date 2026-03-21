import { Flex, Text, TextField, TextArea, Button, Select } from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  challengeCollection,
  roundCollection,
  holeCollection,
  courseCollection,
  formErrorCollection,
  type Challenge,
} from '../../db/collections'
import { getDefaultScope, getChallengeTypeLabel } from '../../lib/challenges'
import { FormField } from '../ui/FormField'
import { challengeFormSchema, validateForm } from '../../lib/validation'

type ChallengeType = Challenge['challengeType']

const CHALLENGE_TYPES: ChallengeType[] = [
  'closest_to_pin',
  'longest_drive',
  'most_birdies',
  'custom',
]

interface ChallengeFormProps {
  tripId: string
  challengeId?: string
  initialData?: Partial<Challenge>
  onSuccess?: () => void
}

export function ChallengeForm({
  tripId,
  challengeId,
  initialData,
  onSuccess,
}: ChallengeFormProps) {
  const formId = `challenge-form-${challengeId || 'new'}`

  const { data: errors } = useLiveQuery(
    (q) => q.from({ e: formErrorCollection }).where(({ e }) => eq(e.formId, formId)),
    [formId]
  )
  const errorMap = new Map(errors?.map((e) => [e.field, e.message]) ?? [])

  // Fetch rounds for this trip
  const { data: rounds } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.tripId, tripId))
        .orderBy(({ round }) => round.roundNumber, 'asc'),
    [tripId]
  )

  // Fetch courses to show names in round selector
  const { data: courses } = useLiveQuery(
    (q) => q.from({ course: courseCollection }),
    []
  )
  const courseMap = new Map((courses || []).map((c) => [c.id, c]))

  // Track form state via data attributes on the form element
  // We use uncontrolled inputs with form data

  function handleTypeChange(value: string, form: HTMLFormElement) {
    const type = value as ChallengeType
    const defaultScope = getDefaultScope(type)

    // Update scope select
    const scopeSelect = form.querySelector('[name="scopeDisplay"]') as HTMLElement
    if (scopeSelect) {
      // Radix Select doesn't support direct value setting, so we use a hidden input
      const scopeHidden = form.querySelector('[name="scope"]') as HTMLInputElement
      if (scopeHidden) {
        scopeHidden.value = defaultScope
      }
    }

    // Show/hide round and hole selectors based on scope
    const roundSection = form.querySelector('[data-field="round"]') as HTMLElement
    const holeSection = form.querySelector('[data-field="hole"]') as HTMLElement

    if (roundSection) {
      roundSection.style.display = defaultScope === 'trip' ? 'none' : 'flex'
    }
    if (holeSection) {
      holeSection.style.display = defaultScope === 'hole' ? 'flex' : 'none'
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const name = (formData.get('name') as string).trim()
    const description = (formData.get('description') as string).trim()
    const challengeType = formData.get('challengeType') as ChallengeType
    const scope = formData.get('scope') as 'hole' | 'round' | 'trip'
    const roundId = formData.get('roundId') as string
    const holeId = formData.get('holeId') as string
    const prizeDescription = (formData.get('prizeDescription') as string).trim()

    const validationData = {
      name,
      challengeType,
      scope,
      roundId: scope !== 'trip' && roundId ? roundId : null,
      holeId: scope === 'hole' && holeId ? holeId : null,
      prizeDescription,
    }

    // Clear old errors
    errors?.forEach((err) => formErrorCollection.delete(err.id))

    // Validate
    const result = validateForm(challengeFormSchema, validationData)

    if (!result.success) {
      Object.entries(result.errors).forEach(([field, message]) => {
        formErrorCollection.insert({
          id: crypto.randomUUID(),
          formId,
          field,
          message,
        })
      })
      return
    }

    const data = {
      tripId,
      name: result.data.name,
      description: description || '',
      challengeType: result.data.challengeType,
      scope: result.data.scope,
      roundId: result.data.roundId,
      holeId: result.data.holeId,
      prizeDescription: result.data.prizeDescription,
    }

    if (challengeId) {
      // Update existing
      challengeCollection.update(challengeId, (d) => {
        Object.assign(d, data)
      })
    } else {
      // Insert new
      challengeCollection.insert({
        id: crypto.randomUUID(),
        ...data,
      })
    }

    onSuccess?.()
  }

  const defaultType = initialData?.challengeType || 'closest_to_pin'
  const defaultScope = initialData?.scope || getDefaultScope(defaultType)
  const showRoundSelector = defaultScope !== 'trip'
  const showHoleSelector = defaultScope === 'hole'

  return (
    <form onSubmit={handleSubmit} data-testid="challenge-form">
      <Flex direction="column" gap="4">
        <FormField label="Challenge Name (optional)" name="name" error={errorMap.get('name')}>
          <TextField.Root
            name="name"
            placeholder="Leave blank to use type as name"
            defaultValue={initialData?.name || ''}
            data-testid="challenge-name-input"
          />
        </FormField>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Type
          </Text>
          <Select.Root
            name="challengeType"
            defaultValue={defaultType}
            onValueChange={(value) => {
              const form = document.querySelector('form') as HTMLFormElement
              if (form) handleTypeChange(value, form)
            }}
          >
            <Select.Trigger />
            <Select.Content>
              {CHALLENGE_TYPES.map((type) => (
                <Select.Item key={type} value={type}>
                  {getChallengeTypeLabel(type)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <input type="hidden" name="scope" defaultValue={defaultScope} />

        <Flex
          direction="column"
          gap="1"
          data-field="round"
          style={{ display: showRoundSelector ? 'flex' : 'none' }}
        >
          <Text as="label" size="2" weight="medium">
            Round
          </Text>
          <Select.Root name="roundId" defaultValue={initialData?.roundId || ''}>
            <Select.Trigger placeholder="Select round" />
            <Select.Content>
              {(rounds || []).map((round) => {
                const course = courseMap.get(round.courseId)
                const dateStr = round.date ? new Date(round.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                return (
                  <Select.Item key={round.id} value={round.id}>
                    R{round.roundNumber}: {course?.name || 'Unknown'} {dateStr && `(${dateStr})`}
                  </Select.Item>
                )
              })}
            </Select.Content>
          </Select.Root>
        </Flex>

        <HoleSelectorField
          defaultRoundId={initialData?.roundId || (rounds?.[0]?.id ?? '')}
          defaultHoleId={initialData?.holeId || ''}
          showInitially={showHoleSelector}
        />

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Description (optional)
          </Text>
          <TextArea
            name="description"
            placeholder="Details about this challenge..."
            defaultValue={initialData?.description || ''}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Prize (optional)
          </Text>
          <TextField.Root
            name="prizeDescription"
            placeholder="$20 pot"
            defaultValue={initialData?.prizeDescription || ''}
          />
        </Flex>

        <Button type="submit" data-testid="challenge-submit-btn">{challengeId ? 'Save Changes' : 'Create Challenge'}</Button>
      </Flex>
    </form>
  )
}

interface HoleSelectorFieldProps {
  defaultRoundId: string
  defaultHoleId: string
  showInitially: boolean
}

function HoleSelectorField({
  defaultRoundId,
  defaultHoleId,
  showInitially,
}: HoleSelectorFieldProps) {
  // Get the round to find its courseId
  const { data: rounds } = useLiveQuery(
    (q) => q.from({ round: roundCollection }),
    []
  )
  const round = rounds?.find((r) => r.id === defaultRoundId)

  // Get all holes for the course
  const { data: holes } = useLiveQuery(
    (q) =>
      round?.courseId
        ? q
            .from({ hole: holeCollection })
            .where(({ hole }) => eq(hole.courseId, round.courseId))
            .orderBy(({ hole }) => hole.holeNumber, 'asc')
        : q.from({ hole: holeCollection }).where(() => false),
    [round?.courseId]
  )

  return (
    <Flex
      direction="column"
      gap="1"
      data-field="hole"
      style={{ display: showInitially ? 'flex' : 'none' }}
    >
      <Text as="label" size="2" weight="medium">
        Hole
      </Text>
      <Select.Root name="holeId" defaultValue={defaultHoleId}>
        <Select.Trigger placeholder="Select hole" />
        <Select.Content>
          {(holes || []).map((hole) => (
            <Select.Item key={hole.id} value={hole.id}>
              Hole {hole.holeNumber} (Par {hole.par})
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  )
}
