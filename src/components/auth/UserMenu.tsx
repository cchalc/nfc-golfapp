import { Link } from '@tanstack/react-router'
import { Button, DropdownMenu, Text, Flex, Avatar } from '@radix-ui/themes'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function UserMenu() {
  const { session, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Link to="/login">
        <Button variant="soft" size="2">
          Sign In
        </Button>
      </Link>
    )
  }

  const initials = session?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="2">
          <Flex align="center" gap="2">
            <Avatar size="1" fallback={initials} radius="full" />
            <Text size="2" className="user-email-text">
              {session?.email}
            </Text>
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>
          <Text size="1" color="gray">
            Signed in as
          </Text>
          <Text size="2" weight="medium">
            {session?.email}
          </Text>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item asChild>
          <Link to="/golfers">
            <Flex align="center" gap="2">
              <User size={14} />
              My Profile
            </Flex>
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onClick={signOut}>
          <Flex align="center" gap="2">
            <LogOut size={14} />
            Sign Out
          </Flex>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
