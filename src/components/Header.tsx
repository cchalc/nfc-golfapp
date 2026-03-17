import { Link } from '@tanstack/react-router'
import { Flex, Text } from '@radix-ui/themes'
import { ThemePicker } from './ThemePicker'

export function Header() {
  return (
    <header style={{ borderBottom: '1px solid var(--gray-6)' }}>
      <Flex align="center" justify="between" py="3" px="4">
        <Flex align="center" gap="5">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Text size="5" weight="bold">
              Golf Trip
            </Text>
          </Link>
          <Flex gap="3" align="center">
            <Link to="/trips" style={{ textDecoration: 'none' }}>
              <Text size="2" color="gray">
                Trips
              </Text>
            </Link>
            <Link to="/golfers" style={{ textDecoration: 'none' }}>
              <Text size="2" color="gray">
                Golfers
              </Text>
            </Link>
          </Flex>
        </Flex>
        <Flex gap="4" align="center">
          <ThemePicker />
        </Flex>
      </Flex>
    </header>
  )
}
