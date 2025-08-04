'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
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
  Select,
  useToast,
  IconButton,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEdit2, 
  FiPlus, 
  FiClock, 
  FiCalendar, 
  FiSettings,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

const MotionBox = motion(Box);

interface SchedulingStats {
  totalPrompts: number;
  activePrompts: number;
  completedPrompts: number;
  upcomingPrompts: number;
  onSchedulePrompts: number;
  currentInterval: number;
  nextAvailableSlot: string;
  baseTime: string;
}

interface SchedulingTimeline {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  scheduledFor: string;
  expectedScheduleTime: string;
  actualScheduleTime: string;
  isOnSchedule: boolean;
  isActive: boolean;
  submissionCount: number;
  createdBy: {
    id: string;
    name: string;
  };
  position: number;
  status: 'completed' | 'upcoming';
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function AdminSchedulingPage() {
  const [schedulingData, setSchedulingData] = useState<{
    schedulingTimeline: SchedulingTimeline[];
    stats: SchedulingStats;
    configuration: {
      intervalMinutes: number;
      baseTime: string;
      currentTime: string;
    };
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [configData, setConfigData] = useState({
    intervalMinutes: 2,
    rescheduleAll: false,
    baseTime: new Date().toISOString().slice(0, 16)
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    autoSchedule: true,
  });

  useEffect(() => {
    fetchSchedulingData();
    fetchCategories();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSchedulingData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedulingData = async () => {
    try {
      const response = await fetch('/api/admin/scheduling');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSchedulingData(data.data);
          setConfigData(prev => ({
            ...prev,
            intervalMinutes: data.data.configuration.intervalMinutes
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching scheduling data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduling data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const handleUpdateConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateInterval',
          intervalMinutes: configData.intervalMinutes,
          baseTime: configData.baseTime,
          rescheduleAll: configData.rescheduleAll
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onConfigClose();
        fetchSchedulingData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreatePrompt = async () => {
    try {
      let scheduledFor = '';
      
      if (formData.autoSchedule && schedulingData) {
        // Auto-schedule based on next available slot
        scheduledFor = schedulingData.stats.nextAvailableSlot;
      } else {
        // Manual scheduling - will be handled in the form
        scheduledFor = new Date().toISOString();
      }

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledFor,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: formData.autoSchedule 
            ? `Prompt created and automatically scheduled for ${new Date(scheduledFor).toLocaleString()}`
            : 'Prompt created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onCreateClose();
        setFormData({ title: '', description: '', categoryId: '', autoSchedule: true });
        fetchSchedulingData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <Text mt={4}>Loading scheduling dashboard...</Text>
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
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <HStack justify="space-between">
              <VStack align="start" spacing={2}>
                <Heading size="xl" className="gradient-text">
                  Prompt Scheduling Management
                </Heading>
                <Text color="gray.600">
                  Manage automatic prompt scheduling and rotation system
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Button colorScheme="blue" leftIcon={<FiSettings />} onClick={onConfigOpen}>
                  Configure
                </Button>
                <Button colorScheme="purple" leftIcon={<FiPlus />} onClick={onCreateOpen}>
                  Create Prompt
                </Button>
              </HStack>
            </HStack>

            {/* Stats Cards */}
            {schedulingData && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiCalendar />
                          <Text>Total Prompts</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{schedulingData.stats.totalPrompts}</StatNumber>
                      <StatHelpText>In scheduling system</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiClock />
                          <Text>Current Interval</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{schedulingData.stats.currentInterval} min</StatNumber>
                      <StatHelpText>Between prompts</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiCheck />
                          <Text>On Schedule</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{schedulingData.stats.onSchedulePrompts}</StatNumber>
                      <StatHelpText>
                        of {schedulingData.stats.totalPrompts} prompts
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Next Available Slot</StatLabel>
                      <StatNumber fontSize="sm">
                        {new Date(schedulingData.stats.nextAvailableSlot).toLocaleTimeString()}
                      </StatNumber>
                      <StatHelpText>
                        {new Date(schedulingData.stats.nextAvailableSlot).toLocaleDateString()}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            )}

            {/* Scheduling Timeline */}
            {schedulingData && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Scheduling Timeline</Heading>
                      <Badge colorScheme="blue">
                        {schedulingData.stats.currentInterval} minute intervals
                      </Badge>
                    </HStack>
                    
                    <TableContainer>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Position</Th>
                            <Th>Title</Th>
                            <Th>Category</Th>
                            <Th>Scheduled Time</Th>
                            <Th>Status</Th>
                            <Th>Schedule Health</Th>
                            <Th>Submissions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {schedulingData.schedulingTimeline.map((prompt) => (
                            <Tr key={prompt.id}>
                              <Td>
                                <Badge colorScheme="gray">#{prompt.position}</Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{prompt.title}</Text>
                                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                    {prompt.description}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme="purple"
                                  style={{ backgroundColor: prompt.category.color }}
                                >
                                  {prompt.category.name}
                                </Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {new Date(prompt.scheduledFor).toLocaleString()}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    Expected: {new Date(prompt.expectedScheduleTime).toLocaleTimeString()}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge colorScheme={prompt.status === 'completed' ? 'green' : 'blue'}>
                                  {prompt.status}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack>
                                  {prompt.isOnSchedule ? (
                                    <Badge colorScheme="green">
                                      <HStack spacing={1}>
                                        <FiCheck size={12} />
                                        <Text>On Time</Text>
                                      </HStack>
                                    </Badge>
                                  ) : (
                                    <Badge colorScheme="orange">
                                      <HStack spacing={1}>
                                        <FiAlertCircle size={12} />
                                        <Text>Off Schedule</Text>
                                      </HStack>
                                    </Badge>
                                  )}
                                </HStack>
                              </Td>
                              <Td>
                                <Text fontWeight="medium">{prompt.submissionCount}</Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </MotionBox>

        {/* Configuration Modal */}
        <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>Scheduling Configuration</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel>Time Interval Between Prompts</FormLabel>
                  <HStack>
                    <NumberInput 
                      value={configData.intervalMinutes}
                      onChange={(_,