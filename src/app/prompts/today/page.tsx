                                                      'use client'

import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  Badge,
  HStack,
  SimpleGrid,
  Avatar
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'
import { Clock, Calendar, Users, Sparkles, Zap, FileText, Image, Video, Heart, MessageCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { SubmissionType } from '@/types'
import { getProxiedImageUrl } from '@/lib/image-utils'

const MotionBox = motion(Box)
const MotionDiv = motion.div

interface Prompt {
  id: string
  title: string
  description: string
  category: { name: string; color: string; icon: string }
  scheduledFor: string
  submissionDeadline?: string
  _count: { submissions: number }
  currentIntervalStart?: string
  currentIntervalEnd?: string
  promptIndex?: number
  totalPrompts?: number
}

interface UserSubmission {
  id: string
  type: SubmissionType
  title?: string
  description?: string
  textContent?: string
  imageUrl?: string
  thumbnailUrl?: string
  likes: number
  views: number
  submittedAt: string
  user: { id: string; name: string; image?: string }
}

const MOCK_PROMPT: Prompt = {
  id: 'mock-prompt-1',
  title: 'Ephemeral Beauty',
  description: 'Capture something beautiful that exists only for a moment - morning dew on a spider\'s web, steam rising from your coffee, shadows dancing on a wall, or the fleeting expression on someone\'s face. Show us the magic in moments that slip away before we notice.',
  category: { name: 'Mixed Media', color: '#8B5CF6', icon: '🎨' },
  scheduledFor: new Date().toISOString(),
  submissionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  _count: { submissions: 47 }
}

const MOCK_SUBMISSIONS: UserSubmission[] = [
  {
    id: '1',
    type: SubmissionType.IMAGE,
    title: 'Morning Dew',
    description: 'Spider web covered in morning dew just as the sun was rising.',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    likes: 24,
    views: 156,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { id: 'user1', name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' }
  },
  {
    id: '2',
    type: SubmissionType.TEXT,
    title: 'Steam Stories',
    textContent: 'The steam from my morning coffee dances upward, creating ephemeral shapes that tell stories only I can see.',
    likes: 18,
    views: 89,
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: { id: 'user2', name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' }
  },
  {
    id: '3',
    type: SubmissionType.VIDEO,
    title: 'Dancing Shadows',
    description: 'Shadows dancing on my wall during golden hour.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
    likes: 31,
    views: 203,
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: { id: 'user3', name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face' }
  },
  {
    id: '4',
    type: SubmissionType.TEXT_IMAGE,
    title: 'Fleeting Expression',
    description: 'My daughter\'s laugh caught in a single frame.',
    textContent: 'They say laughter is contagious, but what they don\'t tell you is how it can freeze time.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
    likes: 42,
    views: 287,
    submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: { id: 'user4', name: 'David Kim', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }
  }
]

export default function TodayPrompt() {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{hours: number, minutes: number, seconds: number} | null>(null)

  useEffect(() => {
    // Fetch real prompt and submissions data from API - NO MOCK DATA
    const fetchData = async () => {
      try {
        // Fetch current prompt - ONLY from database
        const promptResponse = await fetch('/api/prompts/current')
        if (promptResponse.ok) {
          const promptResult = await promptResponse.json()
          if (promptResult.success && promptResult.data) {
            setPrompt(promptResult.data)
            
            // Fetch real submissions for current prompt
            const submissionsResponse = await fetch('/api/submissions/current')
            if (submissionsResponse.ok) {
              const submissionsResult = await submissionsResponse.json()
              if (submissionsResult.success && submissionsResult.data) {
                setSubmissions(submissionsResult.data)
              } else {
                setSubmissions([]) // Empty array if no submissions
              }
            } else {
              setSubmissions([]) // Empty array if API fails
            }
          } else {
            // No active prompt found in database
            setPrompt(null)
            setSubmissions([])
          }
        } else {
          // API failed
          setPrompt(null)
          setSubmissions([])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        // No fallback to mock data - show error state
        setPrompt(null)
        setSubmissions([])
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh data every 30 seconds to check for new prompts/submissions
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Typewriter effect for prompt description
  useEffect(() => {
    if (!prompt || showSubmissions) return

    setIsTyping(true)
    setDisplayedText('')
    
    const text = prompt.description
    let currentIndex = 0
    
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 50) // 50ms delay between characters

    return () => clearInterval(typeInterval)
  }, [prompt, showSubmissions])

  // Real-time countdown timer - shows time until next prompt rotation
  useEffect(() => {
    if (!prompt?.currentIntervalEnd) return

    const updateCountdown = () => {
      const now = Date.now()
      const endTime = new Date(prompt.currentIntervalEnd!).getTime()
      const timeRemaining = Math.max(0, endTime - now)
      
      if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
        setTimeLeft({ hours, minutes, seconds })
      } else {
        // Time is up, show zero and the API polling will automatically fetch the next prompt
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [prompt?.currentIntervalEnd])

  const formatTimeAgo = (dateString: string) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Just now'
    if (diffInHours === 1) return '1 hour ago'
    return `${diffInHours} hours ago`
  }

  if (loading) {
    return (
      <Box minH="100vh" bg="linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)">
        <Navigation />
        <Box display="flex" alignItems="center" justifyContent="center" minH="60vh">
          <MotionDiv
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ rotate: { duration: 2, repeat: Infinity }, scale: { duration: 1.5, repeat: Infinity } }}
          >
            <Sparkles size={48} className="text-purple-400" />
          </MotionDiv>
        </Box>
      </Box>
    )
  }

  // Show "No Active Prompt" state when no prompt exists in database
  if (!loading && !prompt) {
    return (
      <Box minH="100vh" bg="linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)">
        <Navigation />
        <Container maxW="4xl" py={20}>
          <VStack spacing={8} align="center" textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box
                backdropFilter="blur(20px)"
                bg="rgba(255, 255, 255, 0.1)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                borderRadius="2xl"
                p={12}
                boxShadow="xl"
              >
                <VStack spacing={6}>
                  <Heading size="xl" color="white">
                    No Active Prompt
                  </Heading>
                  <Text color="purple.200" fontSize="lg" lineHeight="relaxed">
                    There is currently no active creative prompt. Please check back later or contact an administrator to schedule new prompts.
                  </Text>
                  <Text color="purple.300" fontSize="sm">
                    Prompts are created and scheduled by administrators and will appear here when active.
                  </Text>
                </VStack>
              </Box>
            </MotionBox>
          </VStack>
        </Container>
      </Box>
    )
  }

  if (!prompt) return null

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)" position="relative" overflow="hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MotionDiv
          animate={{ rotate: 360, scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ rotate: { duration: 25, repeat: Infinity }, scale: { duration: 12, repeat: Infinity }, x: { duration: 20, repeat: Infinity }, y: { duration: 15, repeat: Infinity } }}
          style={{
            position: 'absolute',
            top: '-10rem',
            right: '-10rem',
            width: '20rem',
            height: '20rem',
            background: 'rgba(168, 85, 247, 0.15)',
            borderRadius: '50%',
            filter: 'blur(3rem)'
          }}
        />
        <MotionDiv
          animate={{ rotate: -360, scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ rotate: { duration: 30, repeat: Infinity }, scale: { duration: 15, repeat: Infinity }, x: { duration: 25, repeat: Infinity }, y: { duration: 18, repeat: Infinity } }}
          style={{
            position: 'absolute',
            bottom: '-10rem',
            left: '-10rem',
            width: '24rem',
            height: '24rem',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '50%',
            filter: 'blur(3rem)'
          }}
        />
      </div>

      <Navigation />
      
      <Container maxW="7xl" py={16} position="relative" zIndex={1}>
        <VStack spacing={showSubmissions ? 16 : 8} align="stretch">
          {/* Header */}
          <MotionBox initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <MotionDiv initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }}>
              <div className="relative inline-block mb-8">
                {/* Glowing background effect */}
                <MotionDiv
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-violet-600/40 to-purple-600/40 rounded-2xl blur-xl" />
                </MotionDiv>
                
                {/* Main badge */}
                <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-900/60 via-violet-900/60 to-purple-900/60 border-2 border-purple-400/40 rounded-2xl px-12 py-6 shadow-2xl">
                  <div className="text-center">
                    <Text
                      className="text-white text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-violet-100 bg-clip-text text-transparent"
                      style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                    >
                      Daily Creative Challenge
                    </Text>
                    <MotionDiv
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-2" />
                    </MotionDiv>
                  </div>
                </div>
              </div>
            </MotionDiv>
            
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <div className="text-center mb-6">
                <Heading
                  size="4xl"
                  className="text-white font-bold bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent"
                  textAlign="center"
                  style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                >
                  {prompt.title}
                </Heading>
                <MotionDiv
                  initial={{ width: 0 }}
                  animate={{ width: "200px" }}
                  transition={{ duration: 1, delay: 0.8 }}
                >
                  <div className="h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-4 rounded-full" />
                </MotionDiv>
                <Text
                  className="text-purple-200 text-lg mt-3 uppercase tracking-widest"
                  style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                >
                  {prompt.category.name}
                </Text>
              </div>
            </MotionDiv>
            
            <HStack justify="center" spacing={8} className="text-purple-200" flexWrap="wrap">
              <MotionDiv initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <div className="flex items-center gap-3 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <Calendar size={18} />
                  <Text fontSize="md" fontWeight="medium">
                    {new Date(prompt.scheduledFor).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                </div>
              </MotionDiv>
              <MotionDiv initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                <div className="flex items-center gap-3 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <Users size={18} />
                  <Text fontSize="md" fontWeight="medium">{prompt._count.submissions} submissions</Text>
                </div>
              </MotionDiv>
              {timeLeft && (
                <MotionDiv initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }}>
                  <div className="flex items-center gap-3 backdrop-blur-sm bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-2 rounded-full border border-orange-400/30">
                    <MotionDiv animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity }}>
                      <Clock size={18} />
                    </MotionDiv>
                    <Text fontSize="md" fontWeight="medium">
                      {timeLeft.hours > 0 && `${timeLeft.hours}h `}
                      {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
                      {timeLeft.seconds}s left
                    </Text>
                  </div>
                </MotionDiv>
              )}
            </HStack>
          </MotionBox>

          {/* Enhanced Prompt Card */}
          <MotionBox
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: showSubmissions ? "auto" : "80vh"
            }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: showSubmissions ? 1.01 : 1.02, rotateY: 1 }}
          >
            <div className="group relative">
              <MotionDiv
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  background: 'linear-gradient(to right, rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.6))',
                  borderRadius: '2rem',
                  filter: 'blur(2rem)'
                }}
              />
              <MotionDiv
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.02, 1] }}
                transition={{ duration: 6, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  background: 'linear-gradient(to right, rgba(168, 85, 247, 0.4), rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4))',
                  borderRadius: '1.8rem',
                  filter: 'blur(1rem)'
                }}
              />
              
              <div className={`relative backdrop-blur-3xl bg-gradient-to-br from-white/20 to-white/8 border-2 border-white/30 rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ${
                showSubmissions ? 'p-12' : 'p-20 min-h-[60vh] flex flex-col justify-between'
              }`}>
                
                {/* Elegant decorative elements without icons */}
                <div className="absolute top-8 right-8 opacity-20">
                  <MotionDiv
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400/30 to-violet-400/30 blur-sm" />
                  </MotionDiv>
                </div>
                
                <div className="absolute bottom-8 left-8 opacity-15">
                  <MotionDiv
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-400/25 to-purple-400/25 blur-md" />
                  </MotionDiv>
                </div>

                <div className="absolute top-1/3 right-12 opacity-10">
                  <MotionDiv
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-300/20 to-pink-300/20 blur-sm" />
                  </MotionDiv>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <MotionDiv
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <Text
                      fontSize={showSubmissions ? "2xl" : "5xl"}
                      className="text-white leading-relaxed font-medium text-center"
                      lineHeight="1.6"
                      transition="all 0.7s ease"
                      style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                    >
                      {showSubmissions ? prompt.description : displayedText}
                      {!showSubmissions && isTyping && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          style={{ display: 'inline-block', marginLeft: '0.25rem' }}
                        >
                          |
                        </motion.span>
                      )}
                    </Text>
                  </MotionDiv>
                </div>

                {/* Animated Arrow Button */}
                {!showSubmissions && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 20,
                      marginTop: '2rem'
                    }}
                  >
                    <div
                      style={{
                        cursor: 'pointer',
                        zIndex: 50,
                        position: 'relative'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Arrow button clicked!');
                        console.log('Current showSubmissions state:', showSubmissions);
                        console.log('Current submissions:', submissions);
                        console.log('Submissions length:', submissions.length);
                        setShowSubmissions(true);
                        console.log('Setting showSubmissions to true');
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                      <div className="relative group">
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-12px',
                            background: 'linear-gradient(to right, rgba(168, 85, 247, 0.5), rgba(139, 92, 246, 0.5))',
                            borderRadius: '50%',
                            filter: 'blur(1rem)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }}
                          className="group-hover:opacity-100"
                        />
                        <div className="relative backdrop-blur-xl bg-gradient-to-r from-white/20 to-white/10 border-2 border-white/30 rounded-full p-6 shadow-xl" style={{ backgroundColor: 'rgba(168, 85, 247, 0.3)' }}>
                          <MotionDiv
                            animate={{
                              y: [0, 8, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              y: { duration: 2, repeat: Infinity },
                              rotate: { duration: 4, repeat: Infinity }
                            }}
                          >
                            <ChevronDown size={40} className="text-white" />
                          </MotionDiv>
                        </div>
                      </div>
                      </motion.div>
                    </div>
                    
                    <MotionDiv
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.8 }}
                      style={{ textAlign: 'center', marginTop: '1rem' }}
                    >
                      <Text className="text-purple-200 text-xl font-bold">
                        Explore Submissions
                      </Text>
                    </MotionDiv>
                  </MotionDiv>
                )}
              </div>
            </div>
          </MotionBox>

          {/* Today's Submissions */}
          <AnimatePresence>
            {showSubmissions && (
              <MotionBox
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <VStack spacing={8} align="stretch">
                  <MotionDiv initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 1 }}>
                    <div className="text-center">
                      <Heading size="2xl" className="text-white mb-4">
                        Today&apos;s Submissions
                      </Heading>
                    </div>
                  </MotionDiv>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                    <AnimatePresence>
                      {submissions.map((submission, index) => (
                        <MotionDiv
                          key={submission.id}
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -50, scale: 0.9 }}
                          transition={{ duration: 0.6, delay: 1.6 + index * 0.1, type: "spring", stiffness: 100 }}
                          whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.2 } }}
                        >
                          <Link href={`/submissions/${submission.id}`} className="group cursor-pointer relative block">
                            <MotionDiv
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              style={{
                                position: 'absolute',
                                inset: '-4px',
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
                                borderRadius: '1rem',
                                filter: 'blur(8px)'
                              }}
                            />
                            
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-xl overflow-hidden h-96 flex flex-col">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <MotionDiv whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                                    <Avatar size="sm" src={submission.user.image} name={submission.user.name} className="border-2 border-purple-400/30" />
                                  </MotionDiv>
                                  <div>
                                    <Text className="text-white font-semibold text-sm">{submission.user.name}</Text>
                                    <Text className="text-purple-300 text-xs">{formatTimeAgo(submission.submittedAt)}</Text>
                                  </div>
                                </div>
                                <Badge size="sm" className="bg-purple-500/20 text-purple-200 border border-purple-400/30">
                                  {submission.type === SubmissionType.TEXT && <FileText size={12} />}
                                  {submission.type === SubmissionType.IMAGE && <Image size={12} />}
                                  {submission.type === SubmissionType.VIDEO && <Video size={12} />}
                                  {submission.type === SubmissionType.TEXT_IMAGE && <><FileText size={10} /><Image size={10} /></>}
                                </Badge>
                              </div>

                              {/* Content */}
                              <div className="mb-4 flex-1 flex flex-col">
                                {submission.title && (
                                  <Heading size="sm" className="text-white mb-2">{submission.title}</Heading>
                                )}
                                
                                {submission.imageUrl && (
                                  <MotionDiv whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                                    <div className="relative rounded-lg overflow-hidden mb-3">
                                      <img
                                        src={getProxiedImageUrl(submission.imageUrl)}
                                        alt={submission.title || 'Submission'}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                          console.error('Image failed to load:', submission.imageUrl);
                                          console.error('Proxied URL:', getProxiedImageUrl(submission.imageUrl || ''));
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                  </MotionDiv>
                                )}
                                
                                {submission.thumbnailUrl && submission.type === SubmissionType.VIDEO && (
                                  <MotionDiv whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                                    <div className="relative rounded-lg overflow-hidden mb-3">
                                      <img
                                        src={getProxiedImageUrl(submission.thumbnailUrl || '')}
                                        alt={submission.title || 'Video thumbnail'}
                                        className="w-full h-48 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <MotionDiv whileHover={{ scale: 1.1 }}>
                                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                            <Video size={24} className="text-white" />
                                          </div>
                                        </MotionDiv>
                                      </div>
                                    </div>
                                  </MotionDiv>
                                )}
                                
                                {(submission.textContent || submission.description) && (
                                  <div className="flex-1">
                                    <Text className="text-purple-100 text-sm leading-relaxed line-clamp-3">
                                      {submission.textContent || submission.description}
                                    </Text>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                                <HStack spacing={4}>
                                  <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <div className="flex items-center gap-1 text-purple-300 cursor-pointer">
                                      <Heart size={16} />
                                      <Text fontSize="sm">{submission.likes}</Text>
                                    </div>
                                  </MotionDiv>
                                  <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <div className="flex items-center gap-1 text-purple-300 cursor-pointer">
                                      <MessageCircle size={16} />
                                      <Text fontSize="sm">Reply</Text>
                                    </div>
                                  </MotionDiv>
                                </HStack>
                                <Text className="text-purple-400 text-xs">{submission.views} views</Text>
                              </div>
                            </div>
                          </Link>
                        </MotionDiv>
                      ))}
                    </AnimatePresence>
                  </SimpleGrid>
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Submit Your Response */}
          <AnimatePresence>
            {showSubmissions && (
              <MotionBox
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <VStack spacing={6} align="stretch">
                  <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.6 }}>
                    <div className="text-center">
                      <Heading size="xl" className="text-white mb-4">
                        Submit Your Response
                      </Heading>
                    </div>
                  </MotionDiv>

                  <MotionDiv initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.8 }}>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
                      <VStack spacing={4} align="stretch">
                        <textarea
                          placeholder="Share your creative response..."
                          className="w-full h-32 bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-purple-300 resize-none focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                        />
                        <div className="flex justify-end">
                          <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/prompts/today/submit">
                              <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 px-8 py-3 font-semibold shadow-xl"
                              >
                                Post Response
                              </Button>
                            </Link>
                          </MotionDiv>
                        </div>
                      </VStack>
                    </div>
                  </MotionDiv>
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>
        </VStack>
      </Container>
    </Box>
  )
}