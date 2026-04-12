import { Link } from '@tanstack/react-router'
import { Flex, Text, DropdownMenu, IconButton } from '@radix-ui/themes'
import { Menu } from 'lucide-react'
import { ThemePicker } from './ThemePicker'
import { UserMenu } from './auth/UserMenu'

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
          {/* Desktop nav */}
          <Flex gap="4" align="center" className="desktop-nav">
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
        <Flex gap="3" align="center">
          {/* Mobile menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" className="mobile-nav-trigger" style={{ display: 'none' }}>
                <Menu size={20} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item asChild>
                <Link to="/trips">Trips</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link to="/golfers">Golfers</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link to="/courses">Courses</Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <UserMenu />
          <ThemePicker />
        </Flex>
      </Flex>
    </header>
  )
}
