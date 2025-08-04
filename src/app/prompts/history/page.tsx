'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  Button,
  Grid,
  useColorModeValue,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiUsers, FiEye } from 'react-icons/fi';
import Link from 'next/link';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

interface PromptWithStats {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
  scheduledFor: string;
  submissionCount: number;
  recentSubmissions: Array<{
    user: {
      name: string;
      image: string;
    };
  }>;
}

export default function PromptHistoryPage() {
  const [prompts, setPrompts] = useState<PromptWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([]);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchPromptHistory();
    fetchCategories();
  }, []);

  const fetchPromptHistory = async () => {
    try {
      const response = await fetch('/api/prompts/history');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []); // Extract prompts array from response
      }
    } catch (error) {
      console.error('Error fetching prompt history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Box className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <Text mt={4}>Loading prompt history...</Text>
          </Box>
        </Container>
      </Box>
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
          {/* Header */}
          <VStack spacing={6} mb={8} textAlign="center">
            <Heading size="xl" className="gradient-text">
              Prompt History
            </Heading>
            <Text fontSize="lg" color="gray.500" maxW="2xl">
              Explore past creative prompts and see how the community responded. 
              Get inspired by previous challenges and discover new creative directions.
            </Text>
          </VStack>

          {/* Filters */}
          <Card bg={cardBg} borderColor={borderColor} mb={8}>
            <CardBody>
              <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                <InputGroup flex={2}>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <Select
                  flex={1}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Flex>
            </CardBody>
          </Card>

          {/* Results Count */}
          <Text mb={6} color="gray.500">
            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
          </Text>

          {/* Prompts Grid */}
          {filteredPrompts.length > 0 ? (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
              {filteredPrompts.map((prompt, index) => (
                <MotionCard
                  key={prompt.id}
                  bg={cardBg}
                  borderColor={borderColor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  cursor="pointer"
                  _hover={{ shadow: 'lg' }}
                >
                  <CardBody>
                    <VStack align="start" spacing={4}>
                      {/* Category and Date */}
                      <Flex w="100%" justify="space-between" align="center">
                        <Badge
                          colorScheme="purple"
                          style={{ backgroundColor: prompt.category.color }}
                        >
                          {prompt.category.name}
                        </Badge>
                        <HStack fontSize="sm" color="gray.500">
                          <FiCalendar />
                          <Text>
                            {new Date(prompt.scheduledFor).toLocaleDateString()}
                          </Text>
                        </HStack>
                      </Flex>

                      {/* Title and Description */}
                      <VStack align="start" spacing={2} flex={1}>
                        <Heading size="md" noOfLines={2}>
                          {prompt.title}
                        </Heading>
                        <Text color="gray.500" fontSize="sm" noOfLines={3}>
                          {prompt.description}
                        </Text>
                      </VStack>

                      {/* Stats and Participants */}
                      <Flex w="100%" justify="space-between" align="center">
                        <HStack>
                          <FiUsers />
                          <Text fontSize="sm" color="gray.500">
                            {prompt.submissionCount} submission{prompt.submissionCount !== 1 ? 's' : ''}
                          </Text>
                        </HStack>
                        
                        {prompt.recentSubmissions.length > 0 && (
                          <Tooltip label="Recent participants">
                            <AvatarGroup size="sm" max={3}>
                              {prompt.recentSubmissions.map((submission, idx) => (
                                <Avatar
                                  key={idx}
                                  name={submission.user.name}
                                  src={submission.user.image}
                                />
                              ))}
                            </AvatarGroup>
                          </Tooltip>
                        )}
                      </Flex>

                      {/* View Button */}
                      <Button
                        as={Link}
                        href={`/prompts/${prompt.id}`}
                        size="sm"
                        colorScheme="purple"
                        variant="outline"
                        leftIcon={<FiEye />}
                        w="100%"
                      >
                        View Submissions
                      </Button>
                    </VStack>
                  </CardBody>
                </MotionCard>
              ))}
            </Grid>
          ) : (
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} py={12} textAlign="center">
                  <Text fontSize="lg" color="gray.500">
                    No prompts found matching your criteria
                  </Text>
                  <Button
                    colorScheme="purple"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Load More Button */}
          {filteredPrompts.length > 0 && (
            <Box textAlign="center" mt={8}>
              <Button variant="outline" size="lg">
                Load More Prompts
              </Button>
            </Box>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
}