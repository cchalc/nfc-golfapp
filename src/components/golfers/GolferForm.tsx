import { Flex, TextField, Button } from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { golferCollection, formErrorCollection } from '../../db/collections'
import { FormField } from '../ui/FormField'
import { golferFormSchema, validateForm } from '../../lib/validation'

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
  const formId = `golfer-form-${golferId || 'new'}`

  const { data: errors } = useLiveQuery(
    (q) => q.from({ e: formErrorCollection }).where(({ e }) => eq(e.formId, formId)),
    [formId]
  )
  const errorMap = new Map(errors?.map((e) => [e.field, e.message]) ?? [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      name: (formData.get('name') as string).trim(),
      email: (formData.get('email') as string).trim(),
      phone: (formData.get('phone') as string).trim(),
      handicap: parseFloat(formData.get('handicap') as string) || 0,
    }

    // Clear old errors
    errors?.forEach((err) => formErrorCollection.delete(err.id))

    // Validate
    const result = validateForm(golferFormSchema, data)

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

    // Check for duplicate names when creating new golfers
    if (!isEditing) {
      const normalizedName = result.data.name.toLowerCase().trim()
      const existingGolfer = [...golferCollection].find(
        ([, g]) => g.name.toLowerCase().trim() === normalizedName
      )
      if (existingGolfer) {
        formErrorCollection.insert({
          id: crypto.randomUUID(),
          formId,
          field: 'name',
          message: `A golfer named "${existingGolfer[1].name}" already exists`,
        })
        return
      }
    }

    if (isEditing && golferId) {
      golferCollection.update(golferId, (draft) => {
        draft.name = result.data.name
        draft.email = result.data.email
        draft.phone = result.data.phone
        draft.handicap = result.data.handicap
      })
    } else {
      golferCollection.insert({
        id: crypto.randomUUID(),
        ...result.data,
        profileImageUrl: null,
        createdAt: new Date(),
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Name" name="name" error={errorMap.get('name')} required>
          <TextField.Root
            id="name"
            name="name"
            placeholder="John Smith"
            defaultValue={initialData?.name}
          />
        </FormField>

        <FormField label="Email" name="email" error={errorMap.get('email')}>
          <TextField.Root
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            defaultValue={initialData?.email}
          />
        </FormField>

        <FormField label="Phone" name="phone" error={errorMap.get('phone')}>
          <TextField.Root
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 123 4567"
            defaultValue={initialData?.phone}
          />
        </FormField>

        <FormField label="Handicap Index" name="handicap" error={errorMap.get('handicap')}>
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
        </FormField>

        <Button type="submit" color="grass" size="3">
          {isEditing ? 'Save Changes' : 'Add Golfer'}
        </Button>
      </Flex>
    </form>
  )
}
