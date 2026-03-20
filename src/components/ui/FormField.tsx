import { Flex, Text } from '@radix-ui/themes'
import { ReactNode } from 'react'

interface Props {
  label: string
  name: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function FormField({ label, name, error, required, children }: Props) {
  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2" weight="medium" htmlFor={name}>
        {label}
        {required && (
          <Text color="red"> *</Text>
        )}
      </Text>
      {children}
      {error && <Text size="1" color="red">{error}</Text>}
    </Flex>
  )
}
