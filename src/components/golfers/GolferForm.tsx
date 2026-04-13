import { useState } from 'react'
import { Flex, TextField, Button } from '@radix-ui/themes'
import { FormField } from '../ui/FormField'
import { golferFormSchema, validateForm } from '../../lib/validation'
import { useGolfers, useCreateGolfer, useUpdateGolfer } from '../../hooks/queries'

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
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  const { data: golfers } = useGolfers()
  const createGolfer = useCreateGolfer()
  const updateGolfer = useUpdateGolfer()

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
    setErrors(new Map())

    // Validate
    const result = validateForm(golferFormSchema, data)

    if (!result.success) {
      setErrors(new Map(Object.entries(result.errors)))
      return
    }

    // Check for duplicate names when creating new golfers
    if (!isEditing && golfers) {
      const normalizedName = result.data.name.toLowerCase().trim()
      const existingGolfer = golfers.find(
        (g) => g.name.toLowerCase().trim() === normalizedName
      )
      if (existingGolfer) {
        setErrors(new Map([['name', `A golfer named "${existingGolfer.name}" already exists`]]))
        return
      }
    }

    if (isEditing && golferId) {
      updateGolfer.mutate(
        {
          id: golferId,
          changes: {
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            handicap: result.data.handicap,
          },
        },
        { onSuccess }
      )
    } else {
      createGolfer.mutate(
        {
          id: crypto.randomUUID(),
          ...result.data,
          profileImageUrl: null,
        },
        { onSuccess }
      )
    }
  }

  const isPending = createGolfer.isPending || updateGolfer.isPending

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Name" name="name" error={errors.get('name')} required>
          <TextField.Root
            id="name"
            name="name"
            placeholder="John Smith"
            defaultValue={initialData?.name}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Email" name="email" error={errors.get('email')}>
          <TextField.Root
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            defaultValue={initialData?.email}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Phone" name="phone" error={errors.get('phone')}>
          <TextField.Root
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 123 4567"
            defaultValue={initialData?.phone}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Handicap Index" name="handicap" error={errors.get('handicap')}>
          <TextField.Root
            id="handicap"
            name="handicap"
            type="number"
            step="0.1"
            min="0"
            max="54"
            placeholder="18.0"
            defaultValue={initialData?.handicap?.toString()}
            disabled={isPending}
          />
        </FormField>

        <Button type="submit" color="grass" size="3" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Golfer'}
        </Button>
      </Flex>
    </form>
  )
}
