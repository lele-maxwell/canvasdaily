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
  FormErrorMessage,
  Divider,
  HStack,
  Icon,
  Flex
} from '@chakra-ui/react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiZap, FiHome, FiCalendar, FiUsers, FiInfo } from 'react-icons/fi'
import { FaGoogle, FaGithub } from 'react-icons/fa'
import { useToast } from '@chakra-ui/react'
import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export default function SignUpPage() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Client-side validation with Yup
      await validationSchema.validate(formData, { abortEarly: false })
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Show success message
      toast({
        title: 'Account created successfully!',
        description: 'You can now sign in with your credentials.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Auto sign in after successful registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push('/')
      } else {
        // If auto sign-in fails, redirect to sign-in page
        router.push('/auth/signin')
      }

    } catch (error) {
      console.error('Registration error:', error)
      
      if (error instanceof yup.ValidationError) {
        // Handle client-side validation errors
        const validationErrors: Record<string, string> = {}
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message
          }
        })
        setErrors(validationErrors)
        
        toast({
          title: 'Validation Error',
          description: 'Please check the form for errors',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Registration failed',
          description: error instanceof Error ? error.message : 'Please try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
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
            <Heading size="xl">Create Your Account</Heading>
            <Text color="gray.400">Join our community of creators.</Text>
          </VStack>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel color="gray.300">Full Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  bg="gray.800"
                  border="1px"
                  borderColor={errors.name ? "red.500" : "gray.600"}
                  _hover={{ borderColor: errors.name ? "red.400" : 'gray.500' }}
                  _focus={{ borderColor: errors.name ? "red.500" : 'purple.500', boxShadow: errors.name ? '0 0 0 1px red.500' : '0 0 0 1px purple.500' }}
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  required
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="gray.300">Email address</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  bg="gray.800"
                  border="1px"
                  borderColor={errors.email ? "red.500" : "gray.600"}
                  _hover={{ borderColor: errors.email ? "red.400" : 'gray.500' }}
                  _focus={{ borderColor: errors.email ? "red.500" : 'purple.500', boxShadow: errors.email ? '0 0 0 1px red.500' : '0 0 0 1px purple.500' }}
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  required
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="gray.300">Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password (min. 6 characters)"
                  bg="gray.800"
                  border="1px"
                  borderColor={errors.password ? "red.500" : "gray.600"}
                  _hover={{ borderColor: errors.password ? "red.400" : 'gray.500' }}
                  _focus={{ borderColor: errors.password ? "red.500" : 'purple.500', boxShadow: errors.password ? '0 0 0 1px red.500' : '0 0 0 1px purple.500' }}
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  required
                  minLength={6}
                />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                bg="purple.600"
                color="white"
                size="lg"
                w="full"
                _hover={{ bg: 'purple.700' }}
                py={6}
                isLoading={isLoading}
                loadingText="Creating Account..."
              >
                Sign Up
              </Button>
            </VStack>
          </Box>

          <VStack spacing={4}>
            <HStack w="full">
              <Divider borderColor="gray.600" />
              <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                Or sign up with
              </Text>
              <Divider borderColor="gray.600" />
            </HStack>

            <VStack spacing={3} w="full">
              <Button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                variant="outline"
                borderColor="gray.600"
                color="white"
                size="lg"
                w="full"
                leftIcon={<FaGoogle />}
                _hover={{ bg: 'gray.800', borderColor: 'gray.500' }}
              >
                Sign Up with Google
              </Button>

              <Button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                variant="outline"
                borderColor="gray.600"
                color="white"
                size="lg"
                w="full"
                leftIcon={<FaGithub />}
                _hover={{ bg: 'gray.800', borderColor: 'gray.500' }}
              >
                Sign Up with GitHub
              </Button>
            </VStack>
          </VStack>

          <Text textAlign="center" color="gray.400">
            Already have an account?{' '}
            <Link href="/auth/signin">
              <Text as="span" color="purple.400" _hover={{ color: 'purple.300' }}>
                Sign In
              </Text>
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}