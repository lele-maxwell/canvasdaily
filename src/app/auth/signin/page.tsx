'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  FormControl,
  FormLabel,
  Divider,
  HStack,
  Icon,
  Flex,
  Link as ChakraLink
} from '@chakra-ui/react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiZap } from 'react-icons/fi'
import { FaGoogle, FaGithub } from 'react-icons/fa'
import { useToast } from '@chakra-ui/react'

export default function SignInPage() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else if (result?.ok) {
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        router.push('/')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: 'Sign in failed',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.900" color="white">
      {/* Navigation */}
      <Box bg="gray.900" borderBottom="1px" borderColor="gray.700">
        <Container maxW="7xl">
          <Flex justify="space-between" align="center" h={16}>
            {/* Logo */}
            <Link href="/">
              <Flex align="center" gap={2} _hover={{ opacity: 0.8 }}>
                <Box p={2} bg="purple.600" borderRadius="md">
                  <Icon as={FiZap} boxSize={5} color="white" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  Promptly
                </Text>
              </Flex>
            </Link>

            {/* Navigation Links */}
            <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
              <Link href="/">
                <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                  Home
                </Text>
              </Link>
              <Link href="/prompts">
                <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                  Prompts
                </Text>
              </Link>
              <Link href="/community">
                <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                  Community
                </Text>
              </Link>
              <Link href="/about">
                <Text color="gray.300" _hover={{ color: 'white' }} fontWeight="medium">
                  About
                </Text>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="md" py={20}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">Welcome Back</Heading>
            <Text color="gray.400">Sign in to continue to your creative space.</Text>
          </VStack>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel color="gray.300">Email or username</FormLabel>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  bg="gray.800"
                  border="1px"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  bg="gray.800"
                  border="1px"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  required
                />
              </FormControl>

              <Flex justify="flex-end" w="full">
                <ChakraLink color="purple.400" fontSize="sm" _hover={{ color: 'purple.300' }}>
                  Forgot Password?
                </ChakraLink>
              </Flex>

              <Button
                type="submit"
                bg="purple.600"
                color="white"
                size="lg"
                w="full"
                _hover={{ bg: 'purple.700' }}
                py={6}
                isLoading={isLoading}
                loadingText="Signing In..."
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <VStack spacing={4}>
            <HStack w="full">
              <Divider borderColor="gray.600" />
              <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                Or continue with
              </Text>
              <Divider borderColor="gray.600" />
            </HStack>

            <VStack spacing={3} w="full">
              <Button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                bg="gray.700"
                color="white"
                size="lg"
                w="full"
                leftIcon={<FaGoogle />}
                _hover={{ bg: 'gray.600' }}
              >
                Sign in with Google
              </Button>

              <Button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                bg="gray.700"
                color="white"
                size="lg"
                w="full"
                leftIcon={<FaGithub />}
                _hover={{ bg: 'gray.600' }}
              >
                Sign in with GitHub
              </Button>
            </VStack>
          </VStack>

          <Text textAlign="center" color="gray.400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup">
              <Text as="span" color="purple.400" _hover={{ color: 'purple.300' }}>
                Sign up
              </Text>
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}