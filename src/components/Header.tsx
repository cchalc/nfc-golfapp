import { Link } from '@tanstack/react-router'
import { Flex, Text } from '@radix-ui/themes'
import { ThemePicker } from './ThemePicker'

export function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--gray-6)',
        background: 'var(--color-background)',
      }}
    >
      <Flex align="center" justify="between" py="3" px="4">
        <Flex align="center" gap="5">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Text
              size="5"
              weight="bold"
              style={{
                fontFamily: 'var(--heading-font)',
                color: 'var(--amber-9)',
              }}
            >
              Golf Trip
            </Text>
          </Link>
          <Flex gap="4" align="center">
            <Link to="/trips" className="nav-link">
              <Text size="2" color="gray">
                Trips
              </Text>
            </Link>
            <Link to="/golfers" className="nav-link">
              <Text size="2" color="gray">
                Golfers
              </Text>
            </Link>
            <Link to="/courses" className="nav-link">
              <Text size="2" color="gray">
                Courses
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
