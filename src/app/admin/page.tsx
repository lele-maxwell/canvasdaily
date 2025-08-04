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
  Divider,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiUsers, FiFileText, FiActivity, FiClock, FiSettings, FiCalendar, FiCheck, FiAlertCircle } from 'react-icons/fi';

const MotionBox = motion(Box);

interface AdminStats {
  totalUsers: number;
  totalPrompts: number;
  totalSubmissions: number;
  activePrompts: number;
}

interface SchedulerStatus {
  isRunning: boolean;
  intervalMinutes: number;
  activePrompts: number;
  nextPrompt: {
    id: string;
    title: string;
    scheduledFor: string;
    category: string;
  } | null;
  currentActivePrompts: Array<{
    id: string;
    title: string;
    category: string;
    scheduledFor: string;
    submissionCount: number;
  }>;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  scheduledFor: string;
  isActive: boolean;
  submissionCount: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ApiPrompt {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  scheduledFor: string;
  isActive: boolean;
  _count?: {
    submissions: number;
  };
}

interface SchedulingTimelineItem {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  scheduledFor: string;
  isActive: boolean;
  submissionCount: number;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    scheduledFor: '',
    autoSchedule: true,
  });

  const [configData, setConfigData] = useState({
    intervalMinutes: 2,
    rescheduleAll: false,
    baseTime: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    // Always fetch admin data since we bypassed auth for testing
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch scheduler status from scheduling API
      const schedulerResponse = await fetch('/api/admin/scheduling');
      if (schedulerResponse.ok) {
        const schedulerData = await schedulerResponse.json();
        if (schedulerData.success) {
          // Transform the data to match the expected format
          const config = schedulerData.data.configuration;
          const stats = schedulerData.data.stats;
          const timeline = schedulerData.data.schedulingTimeline;
          
          // Calculate next prompt using the same cycling logic as the scheduling system
          const now = new Date();
          const baseTime = new Date(config.baseTime);
          const intervalMs = config.intervalMinutes * 60 * 1000;
          const activePrompts = (timeline as SchedulingTimelineItem[]).filter(p => p.isActive);
          
          let nextPrompt = null;
          let currentActivePrompts: Array<{
            id: string;
            title: string;
            category: string;
            scheduledFor: string;
            submissionCount: number;
          }> = [];
          
          if (activePrompts.length > 0) {
            // Calculate how many intervals have passed since base time
            const timeDiff = now.getTime() - baseTime.getTime();
            const intervalsPassed = Math.floor(timeDiff / intervalMs);
            
            // Current prompt index (cycling through prompts)
            const currentPromptIndex = intervalsPassed % activePrompts.length;
            const nextPromptIndex = (intervalsPassed + 1) % activePrompts.length;
            
            // Calculate when the next prompt will be active
            const nextIntervalStart = new Date(baseTime.getTime() + ((intervalsPassed + 1) * intervalMs));
            
            // Set next prompt info
            const nextPromptData = activePrompts[nextPromptIndex];
            nextPrompt = {
              id: nextPromptData.id,
              title: nextPromptData.title,
              scheduledFor: nextIntervalStart.toISOString(),
              category: nextPromptData.category.name
            };
            
            // Set current active prompt
            const currentPromptData = activePrompts[currentPromptIndex];
            currentActivePrompts = [{
              id: currentPromptData.id,
              title: currentPromptData.title,
              category: currentPromptData.category.name,
              scheduledFor: currentPromptData.scheduledFor,
              submissionCount: currentPromptData.submissionCount || 0
            }];
          }
          
          setSchedulerStatus({
            isRunning: config.isActive || false, // Use isActive from configuration
            intervalMinutes: config.intervalMinutes,
            activePrompts: stats.activePrompts,
            nextPrompt,
            currentActivePrompts
          });
          
          // Update the config data state with current values
          setConfigData({
            intervalMinutes: config.intervalMinutes,
            rescheduleAll: false,
            baseTime: new Date(config.baseTime).toISOString().slice(0, 16)
          });
        }
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Fetch prompts with pagination
      const promptsResponse = await fetch('/api/prompts?limit=20');
      if (promptsResponse.ok) {
        const promptsData = await promptsResponse.json();
        if (promptsData.success) {
          const formattedPrompts = promptsData.data.prompts.map((prompt: ApiPrompt) => ({
            id: prompt.id,
            title: prompt.title,
            description: prompt.description,
            category: prompt.category,
            scheduledFor: prompt.scheduledFor,
            isActive: prompt.isActive,
            submissionCount: prompt._count?.submissions || 0
          }));
          setPrompts(formattedPrompts);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    try {
      let scheduledFor = formData.scheduledFor;
      
      if (formData.autoSchedule) {
        // Get next available slot from scheduling API
        const schedulingResponse = await fetch('/api/admin/scheduling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'autoScheduleNew', intervalMinutes: configData.intervalMinutes }),
        });
        
        if (schedulingResponse.ok) {
          const schedulingData = await schedulingResponse.json();
          scheduledFor = schedulingData.data.nextAvailableSlot;
        }
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
        onClose();
        setFormData({ title: '', description: '', categoryId: '', scheduledFor: '', autoSchedule: true });
        fetchAdminData();
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
        fetchAdminData();
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

  const handleEditPrompt = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      setFormData({
        title: prompt.title,
        description: prompt.description,
        categoryId: prompt.category.id,
        scheduledFor: new Date(prompt.scheduledFor).toISOString().slice(0, 16),
        autoSchedule: false, // Disable auto-schedule for editing existing prompts
      });
      onOpen();
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Prompt deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchAdminData();
      } else {
        throw new Error('Failed to delete prompt');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSchedulerControl = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
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
        fetchAdminData(); // Refresh data
      } else {
        throw new Error('Failed to control scheduler');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} scheduler`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Temporarily bypass auth for testing - REMOVE IN PRODUCTION
  const isAdmin = true; // session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
  
  if (!isAdmin) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box className="text-center">
          <Heading size="lg" mb={4}>Please sign in to access admin panel</Heading>
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
          <Text mt={4}>Loading admin dashboard...</Text>
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
              <Heading size="xl" className="gradient-text">
                Admin Dashboard
              </Heading>
              <Button colorScheme="purple" leftIcon={<FiPlus />} onClick={onOpen}>
                Create New Prompt
              </Button>
            </HStack>

            {/* Stats Cards */}
            {stats && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiUsers />
                          <Text>Total Users</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{stats.totalUsers}</StatNumber>
                      <StatHelpText>Registered members</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiFileText />
                          <Text>Total Prompts</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{stats.totalPrompts}</StatNumber>
                      <StatHelpText>Created prompts</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <FiActivity />
                          <Text>Total Submissions</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{stats.totalSubmissions}</StatNumber>
                      <StatHelpText>User submissions</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Active Prompts</StatLabel>
                      <StatNumber>{stats.activePrompts}</StatNumber>
                      <StatHelpText>Currently active</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            )}

            {/* Scheduler Control */}
            {schedulerStatus && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Prompt Scheduler</Heading>
                      <Badge colorScheme={schedulerStatus.isRunning ? 'green' : 'red'}>
                        {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                      </Badge>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat>
                        <StatLabel>Interval</StatLabel>
                        <StatNumber>{schedulerStatus.intervalMinutes} min</StatNumber>
                        <StatHelpText>Between prompts</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Active Prompts</StatLabel>
                        <StatNumber>{schedulerStatus.activePrompts}</StatNumber>
                        <StatHelpText>Currently live</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Next Prompt</StatLabel>
                        <StatNumber fontSize="sm">
                          {schedulerStatus.nextPrompt ?
                            new Date(schedulerStatus.nextPrompt.scheduledFor).toLocaleTimeString() :
                            'None scheduled'
                          }
                        </StatNumber>
                        <StatHelpText>
                          {schedulerStatus.nextPrompt?.title || 'No upcoming prompts'}
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    <HStack spacing={4}>
                      <Button
                        colorScheme="green"
                        onClick={() => handleSchedulerControl('start')}
                        isDisabled={schedulerStatus.isRunning}
                      >
                        Start Scheduler
                      </Button>
                      <Button
                        colorScheme="red"
                        onClick={() => handleSchedulerControl('stop')}
                        isDisabled={!schedulerStatus.isRunning}
                      >
                        Stop Scheduler
                      </Button>
                    </HStack>

                    {schedulerStatus.currentActivePrompts.length > 0 && (
                      <Box>
                        <Text fontWeight="medium" mb={2}>Currently Active Prompts:</Text>
                        <VStack spacing={2} align="stretch">
                          {schedulerStatus.currentActivePrompts.map((prompt) => (
                            <HStack key={prompt.id} justify="space-between" p={2} bg="gray.50" rounded="md">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{prompt.title}</Text>
                                <Text fontSize="sm" color="gray.600">{prompt.category}</Text>
                              </VStack>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="sm">{prompt.submissionCount} submissions</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(prompt.scheduledFor).toLocaleString()}
                                </Text>
                              </VStack>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Prompts Management */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Manage Prompts</Heading>
                  <Button
                    leftIcon={<FiSettings />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={onConfigOpen}
                  >
                    Scheduling Configuration
                  </Button>
                </HStack>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Title</Th>
                        <Th>Category</Th>
                        <Th>Scheduled For</Th>
                        <Th>Status</Th>
                        <Th>Submissions</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {prompts.map((prompt) => (
                        <Tr key={prompt.id}>
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
                            <Text fontSize="sm">
                              {new Date(prompt.scheduledFor).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={prompt.isActive ? 'green' : 'gray'}>
                              {prompt.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                          <Td>{prompt.submissionCount}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit prompt"
                                icon={<FiEdit2 />}
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPrompt(prompt.id)}
                              />
                              <IconButton
                                aria-label="Delete prompt"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeletePrompt(prompt.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        </MotionBox>

        {/* Create Prompt Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>Create New Prompt</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input 
                    placeholder="Enter prompt title..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    placeholder="Describe the creative challenge..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    placeholder="Select category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Auto-Schedule</FormLabel>
                  <HStack>
                    <Switch
                      isChecked={formData.autoSchedule}
                      onChange={(e) => setFormData({...formData, autoSchedule: e.target.checked})}
                    />
                    <Text fontSize="sm" color="gray.600">
                      Automatically schedule based on last prompt + interval
                    </Text>
                  </HStack>
                </FormControl>
                {!formData.autoSchedule && (
                  <FormControl>
                    <FormLabel>Scheduled For</FormLabel>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                    />
                  </FormControl>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" onClick={handleCreatePrompt}>
                Create Prompt
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Scheduling Configuration Modal */}
        <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>
              <HStack>
                <FiSettings />
                <Text>Scheduling Configuration</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel>
                    <HStack>
                      <FiClock />
                      <Text>Prompt Interval (Minutes)</Text>
                    </HStack>
                  </FormLabel>
                  <NumberInput
                    value={configData.intervalMinutes}
                    onChange={(_, value) => setConfigData({...configData, intervalMinutes: value})}
                    min={1}
                    max={1440}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Time between prompt rotations (2 minutes for testing, 1440 for daily)
                  </Text>
                </FormControl>

                <Divider />

                <FormControl>
                  <FormLabel>
                    <HStack>
                      <FiCalendar />
                      <Text>Base Time for Scheduling</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    type="datetime-local"
                    value={configData.baseTime}
                    onChange={(e) => setConfigData({...configData, baseTime: e.target.value})}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Reference time for calculating prompt schedules
                  </Text>
                </FormControl>

                <Divider />

                <FormControl>
                  <FormLabel>
                    <HStack>
                      <FiAlertCircle />
                      <Text>Reschedule All Existing Prompts</Text>
                    </HStack>
                  </FormLabel>
                  <HStack>
                    <Switch
                      isChecked={configData.rescheduleAll}
                      onChange={(e) => setConfigData({...configData, rescheduleAll: e.target.checked})}
                      colorScheme="orange"
                    />
                    <Text fontSize="sm" color="gray.600">
                      Recalculate all prompt schedules based on new settings
                    </Text>
                  </HStack>
                  {configData.rescheduleAll && (
                    <Box mt={2} p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                      <Text fontSize="sm" color="orange.700">
                        <strong>Warning:</strong> This will update the scheduled times for all existing prompts
                        based on the new interval and base time. This action cannot be undone.
                      </Text>
                    </Box>
                  )}
                </FormControl>

                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
                    How Scheduling Works:
                  </Text>
                  <VStack align="start" spacing={1} fontSize="sm" color="blue.600">
                    <Text>• Prompts rotate automatically based on the interval</Text>
                    <Text>• New prompts are scheduled after the last existing prompt</Text>
                    <Text>• The system cycles through all prompts continuously</Text>
                    <Text>• Use 2 minutes for testing, 1440 minutes (24 hours) for production</Text>
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onConfigClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleUpdateConfiguration}
                leftIcon={<FiCheck />}
              >
                Update Configuration
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}