'use client'

import {
  Box,
  Flex,
  HStack,
  Button,
  Text,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Icon,
  Skeleton
} from '@chakra-ui/react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { FiZap, FiChevronDown } from 'react-icons/fi'
import { ClientOnly } from './ClientOnly'

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <Box bg="gray.900" borderBottom="1px" borderColor="gray.700" position="sticky" top={0} zIndex={1000}>
      <Container maxW="7xl">
        <Flex justify="space-between" align="center" h={16}>
          {/* Logo */}
          <Link href="/">
            <Flex align="center" gap={2} _hover={{ opacity: 0.8 }}>
              <Box p={2} bg="purple.600" borderRadius="md">
                <Icon as={FiZap} boxSize={5} color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="white">
                Creative Sparks
              </Text>
            </Flex>
          </Link>

          {/* Navigation Links */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            <Link href="/prompts/today">
              <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                Today&apos;s Prompt
              </Text>
            </Link>
            <Link href="/prompts/history">
              <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                Past Prompts
              </Text>
            </Link>
            <Link href="/community">
              <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                Community
              </Text>
            </Link>
          </HStack>

          {/* Auth Section */}
          <ClientOnly fallback={
            <HStack spacing={3}>
              <Skeleton height="40px" width="80px" />
              <Skeleton height="40px" width="100px" />
            </HStack>
          }>
            <HStack spacing={4}>
              {status === 'loading' ? (
                <HStack spacing={3}>
                  <Skeleton height="40px" width="80px" />
                  <Skeleton height="40px" width="100px" />
                </HStack>
              ) : session ? (
                <Menu>
                  <MenuButton as={Button} variant="ghost" rightIcon={<FiChevronDown />}>
                    <HStack>
                      <Avatar size="sm" src={session.user?.image || undefined} name={session.user?.name || 'User'} />
                      <Text color="white" display={{ base: 'none', md: 'block' }}>
                        {session.user?.name}
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList bg="gray.800" borderColor="gray.600">
                    <MenuItem as={Link} href="/profile" bg="gray.800" _hover={{ bg: 'gray.700' }} color="white">
                      Profile
                    </MenuItem>
                    <MenuItem as={Link} href="/submissions" bg="gray.800" _hover={{ bg: 'gray.700' }} color="white">
                      My Submissions
                    </MenuItem>
                    {(session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') && (
                      <MenuItem as={Link} href="/admin" bg="gray.800" _hover={{ bg: 'gray.700' }} color="white">
                        Admin Panel
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => signOut()} bg="gray.800" _hover={{ bg: 'gray.700' }} color="white">
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={3}>
                  <Link href="/auth/signin">
                    <Button variant="ghost" color="white" _hover={{ bg: 'gray.700' }}>
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button
                      bg="purple.600"
                      color="white"
                      _hover={{ bg: 'purple.700' }}
                      borderRadius="md"
                      px={6}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </HStack>
              )}
            </HStack>
          </ClientOnly>
        </Flex>
      </Container>
    </Box>
  )
}