'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiCalendar, FiTrendingUp, FiAward } from 'react-icons/fi';

const MotionBox = motion(Box);

interface UserStats {
  totalSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCategory: string;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  prompt: {
    title: string;
    category: string;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/users/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      // Fetch user submissions
      const submissionsResponse = await fetch('/api/submissions/user');
      if (submissionsResponse.ok) {
        const userSubmissions = await submissionsResponse.json();
        setSubmissions(userSubmissions);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box className="text-center">
          <Heading size="lg" mb={4}>Please sign in to view your profile</Heading>
          <Button as="a" href="/auth/signin" colorScheme="purple">
            Sign In
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <Text mt={4}>Loading your profile...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <Card bg={cardBg} borderColor={borderColor} mb={8}>
            <CardBody>
              <HStack spacing={6} align="start">
                <Avatar
                  size="2xl"
                  src={session.user.image || '/default-avatar.svg'}
                  name={session.user.name || 'User'}
                />
                <VStack align="start" flex={1} spacing={2}>
                  <HStack>
                    <Heading size="lg">{session.user.name}</Heading>
                    <IconButton
                      aria-label="Edit profile"
                      icon={<FiEdit2 />}
                      size="sm"
                      variant="ghost"
                      onClick={onOpen}
                    />
                  </HStack>
                  <Text color="gray.500">{session.user.email}</Text>
                  <HStack spacing={4} mt={4}>
                    <Badge colorScheme="purple" className="badge-lg">
                      {session.user.role || 'USER'}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      Member since {new Date().toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Stats Cards */}
          {userStats && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
              <MotionBox
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiCalendar />
                          <Text>Total Submissions</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{userStats.totalSubmissions}</StatNumber>
                      <StatHelpText>Creative works shared</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </MotionBox>

              <MotionBox
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiTrendingUp />
                          <Text>Current Streak</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{userStats.currentStreak}</StatNumber>
                      <StatHelpText>Days in a row</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </MotionBox>

              <MotionBox
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiAward />
                          <Text>Best Streak</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{userStats.longestStreak}</StatNumber>
                      <StatHelpText>Personal record</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </MotionBox>

              <MotionBox
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Favorite Category</StatLabel>
                      <StatNumber fontSize="lg">{userStats.favoriteCategory}</StatNumber>
                      <StatHelpText>Most active in</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </MotionBox>
            </SimpleGrid>
          )}

          {/* Content Tabs */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Tabs variant="soft-rounded" colorScheme="purple">
                <TabList mb={6}>
                  <Tab>My Submissions</Tab>
                  <Tab>Favorites</Tab>
                  <Tab>Activity</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel px={0}>
                    {submissions.length > 0 ? (
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                        {submissions.map((submission, index) => (
                          <MotionBox
                            key={submission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <Card bg={cardBg} borderColor={borderColor} overflow="hidden">
                              {submission.mediaType.startsWith('image/') && (
                                <Image
                                  src={submission.mediaUrl}
                                  alt={submission.title}
                                  h="200px"
                                  w="100%"
                                  objectFit="cover"
                                />
                              )}
                              <CardBody>
                                <VStack align="start" spacing={2}>
                                  <Heading size="sm">{submission.title}</Heading>
                                  <Text fontSize="sm" color="gray.500">
                                    {submission.prompt.title}
                                  </Text>
                                  <Badge colorScheme="purple" size="sm">
                                    {submission.prompt.category}
                                  </Badge>
                                  <Text fontSize="xs" color="gray.400">
                                    {new Date(submission.createdAt).toLocaleDateString()}
                                  </Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          </MotionBox>
                        ))}
                      </Grid>
                    ) : (
                      <Box textAlign="center" py={12}>
                        <Text color="gray.500" mb={4}>No submissions yet</Text>
                        <Button as="a" href="/prompts/today" colorScheme="purple">
                          Create Your First Submission
                        </Button>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel px={0}>
                    <Box textAlign="center" py={12}>
                      <Text color="gray.500">Favorites feature coming soon!</Text>
                    </Box>
                  </TabPanel>

                  <TabPanel px={0}>
                    <Box textAlign="center" py={12}>
                      <Text color="gray.500">Activity feed coming soon!</Text>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </MotionBox>

        {/* Edit Profile Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>Edit Profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Display Name</FormLabel>
                  <Input defaultValue={session.user.name || ''} />
                </FormControl>
                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Textarea placeholder="Tell us about yourself..." />
                </FormControl>
                <FormControl>
                  <FormLabel>Website</FormLabel>
                  <Input placeholder="https://your-website.com" />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="purple">Save Changes</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}