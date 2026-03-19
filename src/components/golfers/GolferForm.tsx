import { Flex, TextField, Button, Text } from '@radix-ui/themes'
import { golferCollection } from '../../db/collections'

interface GolferFormData {
  name: string
  email: string
  phone: string
  handicap: number
}

interface GolferFormProps {
  initialData?: Partial<GolferFormData>
  golferId?: string
  onSuccess?: () => void
}

export function GolferForm({ initialData, golferId, onSuccess }: GolferFormProps) {
  const isEditing = !!golferId

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || '',
      phone: (formData.get('phone') as string) || '',
      handicap: parseFloat(formData.get('handicap') as string) || 0,
    }

    if (isEditing && golferId) {
      golferCollection.update(golferId, (draft) => {
        draft.name = data.name
        draft.email = data.email
        draft.phone = data.phone
        draft.handicap = data.handicap
      })
    } else {
      golferCollection.insert({
        id: crypto.randomUUID(),
        ...data,
        profileImageUrl: null,
        createdAt: new Date(),
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="name">
            Name
          </Text>
          <TextField.Root
            id="name"
            name="name"
            placeholder="John Smith"
            defaultValue={initialData?.name}
            required
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="email">
            Email
          </Text>
          <TextField.Root
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            defaultValue={initialData?.email}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="phone">
            Phone
          </Text>
          <TextField.Root
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 123 4567"
            defaultValue={initialData?.phone}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="handicap">
            Handicap Index
          </Text>
          <TextField.Root
            id="handicap"
            name="handicap"
            type="number"
            step="0.1"
            min="0"
            max="54"
            placeholder="18.0"
            defaultValue={initialData?.handicap?.toString()}
          />
        </Flex>

        <Button type="submit" color="grass" size="3">
          {isEditing ? 'Save Changes' : 'Add Golfer'}
        </Button>
      </Flex>
    </form>
  )
}
