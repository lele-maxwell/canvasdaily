'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Textarea,
  Divider,
  Badge,
  useToast
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'
import { Heart, MessageCircle, Share2, ArrowLeft, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SubmissionType } from '@/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const MotionBox = motion(Box)
const MotionDiv = motion.div

interface Submission {
  id: string
  type: SubmissionType
  title: string
  description?: string
  textContent?: string
  imageUrl?: string
  thumbnailUrl?: string
  likes: number
  views: number
  shares: number
  submittedAt: string
  user: {
    id: string
    name: string
    image?: string
    username?: string
  }
  prompt: {
    id: string
    title: string
  }
  comments: Comment[]
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
    username?: string
  }
  likes: number
}

// Mock data for the submission
const MOCK_SUBMISSION: Submission = {
  id: 'submission-1',
  type: SubmissionType.IMAGE,
  title: 'Urban Solitude',
  description: 'In the heart of the city, a lone figure stands amidst the bustling crowd, their silhouette stark against the vibrant backdrop of neon lights and towering skyscrapers. The air is thick with the sounds of honking cars, distant sirens, and the chatter of passersby, yet the figure remains still, lost in their own world. Their gaze is fixed on something unseen, a flicker of emotion playing across their face as they navigate the labyrinth of their thoughts. The city\'s energy pulses around them, a symphony of chaos and beauty, but in this moment, they are an island of solitude, a silent observer in the urban tapestry.',
  imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
  likes: 234,
  views: 1247,
  shares: 12,
  submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  user: {
    id: 'user-1',
    name: 'Sophia Writes',
    username: 'sophia_writes',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
  },
  prompt: {
    id: 'prompt-1',
    title: 'Ephemeral Beauty'
  },
  comments: []
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    content: 'This is such a powerful image. The contrast between the individual\'s stillness and the city\'s movement is striking. It really makes you think about the moments of solitude we find in crowded places.',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
    user: {
      id: 'user-2',
      name: 'Liam Reads',
      username: 'liam_reads',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
    },
    likes: 15
  },
  {
    id: 'comment-2',
    content: 'I love how the description captures the sensory overload of the city. The mention of neon lights and skyscrapers paints a vivid picture. It\'s like being there, feeling the energy and the isolation at the same time.',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    user: {
      id: 'user-3',
      name: 'Ava Arts',
      username: 'ava_arts',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
    },
    likes: 8
  },
  {
    id: 'comment-3',
    content: 'The phrase "island of solitude" is perfect. It encapsulates the feeling of being alone in a crowd so well. The description is beautifully written, evoking a strong emotional response.',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    user: {
      id: 'user-4',
      name: 'Ethan Views',
      username: 'ethan_views',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    },
    likes: 12
  }
]

export default function SubmissionDetail() {
  const { data: session } = useSession()
  const params = useParams()
  const toast = useToast()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true)
      
      try {
        // Try to fetch real submission data first
        const res = await fetch(`/api/submissions/${params.id}`)
        
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            // Use real data
            setSubmission(data.data)
            setComments(data.data.comments || [])
            setLoading(false)
            return
          }
        }
        
        // If real data fetch fails or returns no data, check if it's a mock submission
        // Mock submission IDs start with 'cmdw' (from seeded data)
        if (typeof params.id === 'string' && params.id.startsWith('cmdw')) {
          // This is likely a real submission but API might not be working
          // Try to fetch from the general submissions API
          const allSubmissionsRes = await fetch('/api/submissions?limit=50')
          if (allSubmissionsRes.ok) {
            const allData = await allSubmissionsRes.json()
            const realSubmission = allData.data?.submissions?.find((s: Submission) => s.id === params.id)
            if (realSubmission) {
              setSubmission(realSubmission)
              setComments([]) // No comments for real submissions yet
              setLoading(false)
              return
            }
          }
        }
        
        // Fallback to mock data for demo purposes
        console.log('Using mock data for submission:', params.id)
        setSubmission(MOCK_SUBMISSION)
        setComments(MOCK_COMMENTS)
        
      } catch (error) {
        console.error('Error fetching submission:', error)
        // Fallback to mock data
        setSubmission(MOCK_SUBMISSION)
        setComments(MOCK_COMMENTS)
      }
      
      setLoading(false)
    }

    fetchSubmission()
  }, [params.id])

  const formatTimeAgo = (dateString: string) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Just now'
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/submissions/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })
      const result = await response.json()
      if (result.success && result.data) {
        setComments([result.data, ...comments])
        setNewComment('')
      } else {
        toast({
          title: 'Error posting comment',
          description: result.error || 'Failed to post comment',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error posting comment',
        description: 'Failed to post comment. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <MotionDiv
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ rotate: { duration: 2, repeat: Infinity }, scale: { duration: 1.5, repeat: Infinity } }}
          >
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </MotionDiv>
        </div>
      </div>
    )
  }

  if (!submission) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <Container maxW="4xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Breadcrumb */}
          <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <HStack spacing={2} className="text-gray-400 text-sm">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Text>/</Text>
              <Text className="text-white">Post</Text>
            </HStack>
          </MotionDiv>

          {/* Back Button */}
          <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Link href="/prompts/today">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={16} />}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                size="sm"
              >
                Back to Submissions
              </Button>
            </Link>
          </MotionDiv>

          {/* User Info */}
          <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <HStack spacing={4}>
              <Avatar 
                size="md" 
                src={submission.user.image} 
                name={submission.user.name}
                className="border-2 border-purple-400/30"
              />
              <VStack align="start" spacing={0}>
                <Text className="text-white font-semibold text-lg">{submission.user.name}</Text>
                <HStack spacing={2} className="text-gray-400 text-sm">
                  <Calendar size={14} />
                  <Text>Posted {formatTimeAgo(submission.submittedAt)}</Text>
                </HStack>
              </VStack>
            </HStack>
          </MotionBox>

          {/* Main Content */}
          <MotionBox initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <VStack spacing={6} align="stretch">
              {/* Featured Image */}
              {submission.imageUrl && (
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={submission.imageUrl}
                      alt={submission.title}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </MotionDiv>
              )}

              {/* Title */}
              <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
                <Heading 
                  size="2xl" 
                  className="text-white font-bold"
                  style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                >
                  {submission.title}
                </Heading>
              </MotionDiv>

              {/* Description */}
              {submission.description && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
                  <Text 
                    className="text-gray-300 text-lg leading-relaxed"
                    style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                  >
                    {submission.description}
                  </Text>
                </MotionDiv>
              )}

              {/* Text Content */}
              {submission.textContent && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
                  <Text className="text-gray-300 text-lg leading-relaxed italic">
                    &ldquo;{submission.textContent}&rdquo;
                  </Text>
                </MotionDiv>
              )}

              {/* Engagement Metrics */}
              <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
                <HStack spacing={6} className="py-4">
                  <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      leftIcon={<Heart size={20} className={isLiked ? 'text-red-500 fill-current' : 'text-gray-400'} />}
                      className={`${isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-400`}
                      onClick={handleLike}
                    >
                      {submission.likes + (isLiked ? 1 : 0)}
                    </Button>
                  </MotionDiv>
                  
                  <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      leftIcon={<MessageCircle size={20} />}
                      className="text-gray-400 hover:text-blue-400"
                    >
                      {comments.length}
                    </Button>
                  </MotionDiv>
                  
                  <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      leftIcon={<Share2 size={20} />}
                      className="text-gray-400 hover:text-green-400"
                    >
                      {submission.shares}
                    </Button>
                  </MotionDiv>
                </HStack>
              </MotionDiv>
            </VStack>
          </MotionBox>

          <Divider className="border-gray-700" />

          {/* Comments Section */}
          <MotionBox initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" className="text-white">
                Comments ({comments.length})
              </Heading>

              {/* Add Comment */}
              {session && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}>
                  <HStack spacing={4} align="start">
                    <Avatar
                      size="sm"
                      src={session.user?.image || undefined}
                      name={session.user?.name || 'You'}
                      className="border-2 border-purple-400/30"
                    />
                    <VStack spacing={3} flex={1} align="stretch">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none focus:border-purple-400 focus:ring-purple-400"
                        rows={3}
                      />
                      <HStack justify="end">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={handleComment}
                          isDisabled={!newComment.trim()}
                        >
                          Post
                        </Button>
                      </HStack>
                    </VStack>
                  </HStack>
                </MotionDiv>
              )}

              {/* Comments List */}
              <VStack spacing={4} align="stretch">
                <AnimatePresence>
                  {comments.map((comment, index) => (
                    <MotionDiv
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Box className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <HStack spacing={3} align="start">
                          <Avatar
                            size="sm"
                            src={comment.user.image}
                            name={comment.user.name}
                            className="border-2 border-purple-400/30"
                          />
                          <VStack spacing={2} align="start" flex={1}>
                            <HStack spacing={2}>
                              <Text className="text-white font-semibold text-sm">
                                {comment.user.name}
                              </Text>
                              <Text className="text-gray-400 text-xs">
                                {formatTimeAgo(comment.createdAt)}
                              </Text>
                            </HStack>
                            <Text className="text-gray-300 text-sm leading-relaxed">
                              {comment.content}
                            </Text>
                            <HStack spacing={4}>
                              <MotionDiv whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  leftIcon={<Heart size={14} />}
                                  className="text-gray-400 hover:text-red-400"
                                >
                                  {comment.likes}
                                </Button>
                              </MotionDiv>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-gray-400 hover:text-blue-400"
                              >
                                Reply
                              </Button>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    </MotionDiv>
                  ))}
                </AnimatePresence>
              </VStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </div>
  )
}