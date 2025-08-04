'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Flex,
  HStack,
  Grid,
  GridItem,
  Icon,
  Link as ChakraLink
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiEdit3, FiGlobe, FiUsers, FiTwitter, FiInstagram } from 'react-icons/fi'
import { FaPinterest } from 'react-icons/fa'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

const MotionBox = motion(Box)

export default function Home() {
  return (
    <Box minH="100vh" bg="gray.900" color="white">
      <Navigation />
      
      {/* Hero Section with Background */}
      <Box
        minH="80vh"
        bgImage="url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 100%)',
          zIndex: 1
        }}
      >
        <Container maxW="4xl" textAlign="center" position="relative" zIndex={2}>
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Heading
              as="h1"
              fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
              fontWeight="bold"
              mb={6}
              lineHeight="1.1"
              textShadow="2px 2px 4px rgba(0,0,0,0.8)"
            >
              Ignite Your Imagination
            </Heading>
            
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="gray.200"
              mb={8}
              maxW="2xl"
              mx="auto"
              textShadow="1px 1px 2px rgba(0,0,0,0.8)"
            >
              Dive into today&apos;s creative prompt and share your unique
              perspective with a global community of artists and writers.
            </Text>

            <Link href="/prompts/today">
              <Button
                size="lg"
                bg="purple.600"
                color="white"
                px={8}
                py={6}
                fontSize="lg"
                borderRadius="md"
                _hover={{ bg: 'purple.700', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                boxShadow="0 4px 15px rgba(139, 92, 246, 0.3)"
              >
                View Today&apos;s Prompt
              </Button>
            </Link>
          </MotionBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg="gray.900">
        <Container maxW="6xl">
          <VStack spacing={12}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              textAlign="center"
            >
              <Heading size="xl" mb={4} color="white">
                Explore the World of Creative Prompts
              </Heading>
              <Text color="gray.400" fontSize="lg" maxW="3xl">
                Discover a platform designed to inspire and connect creative minds from around the globe.
              </Text>
            </MotionBox>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} w="full" maxW="5xl" mx="auto">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Box
                  bg="linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
                  p={6}
                  borderRadius="xl"
                  textAlign="center"
                  h="200px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  position="relative"
                  overflow="hidden"
                  boxShadow="0 8px 32px rgba(139, 92, 246, 0.3)"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
                  transition="all 0.3s ease"
                >
                  <Icon as={FiEdit3} boxSize={10} mb={3} mx="auto" color="white" />
                  <Heading size="md" mb={3} color="white" fontWeight="600">Daily Inspiration</Heading>
                  <Text color="rgba(255,255,255,0.9)" fontSize="sm" lineHeight="1.4" px={2}>
                    Receive a fresh, thought-provoking prompt every day to fuel your creativity.
                  </Text>
                </Box>
              </MotionBox>

              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Box
                  bg="linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)"
                  p={6}
                  borderRadius="xl"
                  textAlign="center"
                  h="200px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  position="relative"
                  overflow="hidden"
                  boxShadow="0 8px 32px rgba(124, 58, 237, 0.3)"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(124, 58, 237, 0.4)' }}
                  transition="all 0.3s ease"
                >
                  <Icon as={FiGlobe} boxSize={10} mb={3} mx="auto" color="white" />
                  <Heading size="md" mb={3} color="white" fontWeight="600">Multilingual Support</Heading>
                  <Text color="rgba(255,255,255,0.9)" fontSize="sm" lineHeight="1.4" px={2}>
                    Engage with prompts and submissions in multiple languages, fostering a diverse and inclusive creative space.
                  </Text>
                </Box>
              </MotionBox>

              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Box
                  bg="linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)"
                  p={6}
                  borderRadius="xl"
                  textAlign="center"
                  h="200px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  position="relative"
                  overflow="hidden"
                  boxShadow="0 8px 32px rgba(109, 40, 217, 0.3)"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(109, 40, 217, 0.4)' }}
                  transition="all 0.3s ease"
                >
                  <Icon as={FiUsers} boxSize={10} mb={3} mx="auto" color="white" />
                  <Heading size="md" mb={3} color="white" fontWeight="600">Community Showcase</Heading>
                  <Text color="rgba(255,255,255,0.9)" fontSize="sm" lineHeight="1.4" px={2}>
                    Share your work, connect with fellow creators, and celebrate the power of collective imagination.
                  </Text>
                </Box>
              </MotionBox>
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="black" py={10} borderTop="1px" borderColor="gray.800">
        <Container maxW="6xl">
          <VStack spacing={6}>
            <HStack spacing={8} justify="center">
              <Link href="/about">
                <Text color="gray.400" _hover={{ color: 'white' }} fontSize="sm">About</Text>
              </Link>
              <Link href="/contact">
                <Text color="gray.400" _hover={{ color: 'white' }} fontSize="sm">Contact</Text>
              </Link>
              <Link href="/terms">
                <Text color="gray.400" _hover={{ color: 'white' }} fontSize="sm">Terms of Service</Text>
              </Link>
              <Link href="/privacy">
                <Text color="gray.400" _hover={{ color: 'white' }} fontSize="sm">Privacy Policy</Text>
              </Link>
            </HStack>
            
            <HStack spacing={4}>
              <ChakraLink href="#" _hover={{ color: 'purple.400' }}>
                <Icon as={FiTwitter} boxSize={5} color="gray.400" />
              </ChakraLink>
              <ChakraLink href="#" _hover={{ color: 'purple.400' }}>
                <Icon as={FiInstagram} boxSize={5} color="gray.400" />
              </ChakraLink>
              <ChakraLink href="#" _hover={{ color: 'purple.400' }}>
                <Icon as={FaPinterest} boxSize={5} color="gray.400" />
              </ChakraLink>
            </HStack>
            
            <Text color="gray.500" fontSize="sm" textAlign="center">
              © 2024 Creative Sparks. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
