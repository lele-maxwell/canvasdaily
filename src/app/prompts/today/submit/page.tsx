'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  HStack,
  Badge,
  useToast,
  Progress,
  Spinner
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Upload, Camera, Video, X, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SubmissionType } from '@/types'
import { validateFileType, validateFileSize } from '@/lib/utils'

const MotionBox = motion(Box)
const MotionDiv = motion.div

interface Prompt {
  id: string
  title: string
  description: string
  category: { name: string; color: string; icon: string }
  scheduledFor: string
  allowedTypes: string[]
}

// File upload state interface
interface UploadState {
  file: File | null
  uploading: boolean
  uploaded: boolean
  url: string | null
  error: string | null
}

export default function SubmitPromptResponse() {
  const { data: session } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [textContent, setTextContent] = useState('')
  
  // File upload states
  const [imageUpload, setImageUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    url: null,
    error: null
  })
  
  const [videoUpload, setVideoUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    url: null,
    error: null
  })

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch('/api/prompts/current')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setPrompt(result.data)
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch prompt:', error)
        setLoading(false)
      }
    }

    fetchPrompt()
  }, [])

  // File upload handlers
  const handleImageUpload = async (file: File) => {
    setImageUpload(prev => ({ ...prev, uploading: true, error: null }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      
      if (!data.success || !data.data?.fileUrl) {
        throw new Error('Upload response invalid')
      }
      
      setImageUpload({
        file,
        uploading: false,
        uploaded: true,
        url: data.data.fileUrl,
        error: null
      })
      
      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Image upload error:', error)
      setImageUpload(prev => ({
        ...prev,
        uploading: false,
        error: 'Failed to upload image'
      }))
      
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleVideoUpload = async (file: File) => {
    setVideoUpload(prev => ({ ...prev, uploading: true, error: null }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      
      if (!data.success || !data.data?.fileUrl) {
        throw new Error('Upload response invalid')
      }
      
      setVideoUpload({
        file,
        uploading: false,
        uploaded: true,
        url: data.data.fileUrl,
        error: null
      })
      
      toast({
        title: 'Video uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Video upload error:', error)
      setVideoUpload(prev => ({
        ...prev,
        uploading: false,
        error: 'Failed to upload video'
      }))
      
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const removeImageUpload = () => {
    setImageUpload({
      file: null,
      uploading: false,
      uploaded: false,
      url: null,
      error: null
    })
  }

  const removeVideoUpload = () => {
    setVideoUpload({
      file: null,
      uploading: false,
      uploaded: false,
      url: null,
      error: null
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit your response.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!prompt) {
      toast({
        title: 'Error',
        description: 'No active prompt found.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Title is optional, no validation needed

    if (!textContent.trim()) {
      toast({
        title: 'Story required',
        description: 'Please write your story',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setSubmitting(true)

    try {
      // Determine submission type based on uploaded files
      let finalSubmissionType = SubmissionType.TEXT
      if (imageUpload.uploaded && videoUpload.uploaded) {
        finalSubmissionType = SubmissionType.TEXT_VIDEO // Handle mixed media
      } else if (imageUpload.uploaded) {
        finalSubmissionType = SubmissionType.TEXT_IMAGE
      } else if (videoUpload.uploaded) {
        finalSubmissionType = SubmissionType.TEXT_VIDEO
      }

      const submissionData = {
        promptId: prompt.id,
        title: title.trim(),
        description: description.trim(),
        textContent: textContent.trim(),
        type: finalSubmissionType,
        imageUrl: imageUpload.url,
        videoUrl: videoUpload.url,
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Submission error:', errorData)
        toast({
          title: 'Submission Failed',
          description: errorData.error || 'There was an error submitting your response.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        setSubmitting(false)
        return
      }

      toast({
        title: 'Success!',
        description: 'Your creative response has been submitted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Reset form
      setTitle('')
      setDescription('')
      setTextContent('')
      removeImageUpload()
      removeVideoUpload()

      // Redirect back to the prompt page
      router.push('/prompts/today')
    } catch (error) {
      console.error('Error submitting response:', error)
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your response. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <MotionDiv
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ rotate: { duration: 2, repeat: Infinity }, scale: { duration: 1.5, repeat: Infinity } }}
          >
            <Upload size={48} className="text-purple-400" />
          </MotionDiv>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900">
        <Navigation />
        <Container maxW="4xl" py={16}>
          <VStack spacing={8} align="center">
            <Text className="text-white text-xl">No active prompt found.</Text>
            <Link href="/prompts/today">
              <Button leftIcon={<ArrowLeft size={20} />} variant="outline" colorScheme="purple">
                Back to Prompts
              </Button>
            </Link>
          </VStack>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 relative overflow-hidden">
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
      </div>

      <Navigation />
      
      <Container maxW="4xl" py={16} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <MotionBox initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <VStack spacing={6} align="stretch">
              {/* Back Button */}
              <Link href="/prompts/today">
                <Button leftIcon={<ArrowLeft size={20} />} variant="ghost" colorScheme="purple" size="lg">
                  Back to Today&apos;s Prompt
                </Button>
              </Link>

              {/* Page Title */}
              <div className="text-center">
                <Heading
                  size="2xl"
                  className="text-white font-bold bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent mb-4"
                  style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                >
                  Submit Your Creative Response
                </Heading>
                <Text className="text-purple-200 text-lg">
                  Share your interpretation of today&apos;s prompt
                </Text>
              </div>

              {/* Current Prompt Display */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-xl">
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="lg" className="text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                      {prompt.title}
                    </Heading>
                    <Badge colorScheme="purple" size="lg">
                      {prompt.category.name}
                    </Badge>
                  </HStack>
                  <Text className="text-purple-100 leading-relaxed">
                    {prompt.description}
                  </Text>
                </VStack>
              </div>
            </VStack>
          </MotionBox>

          {/* Submission Form */}
          <MotionBox
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
                <VStack spacing={6} align="stretch">
                  {/* Title */}
                  <FormControl>
                    <FormLabel className="text-white font-semibold mb-3">Title (Optional)</FormLabel>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Whispering Woods at Dawn"
                      className="bg-transparent border-white/20 text-white placeholder-purple-300"
                      focusBorderColor="purple.400"
                      size="lg"
                    />
                  </FormControl>

                  {/* Description */}
                  <FormControl>
                    <FormLabel className="text-white font-semibold mb-3">Description</FormLabel>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A brief summary or context for your post..."
                      className="bg-transparent border-white/20 text-white placeholder-purple-300 resize-none"
                      focusBorderColor="purple.400"
                      rows={3}
                    />
                  </FormControl>

                  {/* Your Story */}
                  <FormControl isRequired>
                    <FormLabel className="text-white font-semibold mb-3">Your Story</FormLabel>
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Once upon a time in a land far, far away..."
                      className="bg-transparent border-white/20 text-white placeholder-purple-300 resize-none"
                      focusBorderColor="purple.400"
                      rows={8}
                      isRequired
                    />
                  </FormControl>

                  {/* Add Media (Optional) */}
                  <FormControl>
                    <FormLabel className="text-white font-semibold mb-3">Add Media (Optional)</FormLabel>
                    <HStack spacing={4}>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(file)
                            }
                          }}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="block">
                          <Button
                            as="span"
                            leftIcon={<Upload size={20} />}
                            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 w-full"
                            size="lg"
                            isLoading={imageUpload.uploading}
                          >
                            {imageUpload.uploading ? 'Uploading...' : 'Upload Image'}
                          </Button>
                        </label>
                        {imageUpload.uploaded && imageUpload.file && (
                          <div className="mt-2 text-center">
                            <Text className="text-green-400 text-sm">
                              ✓ {imageUpload.file.name}
                            </Text>
                            <img
                              src={imageUpload.url!}
                              alt={imageUpload.file.name}
                              className="max-h-40 mx-auto mt-2 rounded-lg object-cover"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={removeImageUpload}
                              className="mt-1"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                        {imageUpload.error && (
                          <Text className="text-red-400 text-sm mt-2 text-center">
                            {imageUpload.error}
                          </Text>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleVideoUpload(file)
                            }
                          }}
                          className="hidden"
                          id="video-upload"
                        />
                        <label htmlFor="video-upload" className="block">
                          <Button
                            as="span"
                            leftIcon={<Upload size={20} />}
                            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 w-full"
                            size="lg"
                            isLoading={videoUpload.uploading}
                          >
                            {videoUpload.uploading ? 'Uploading...' : 'Upload Video'}
                          </Button>
                        </label>
                        {videoUpload.uploaded && videoUpload.file && (
                          <div className="mt-2 text-center">
                            <Text className="text-green-400 text-sm">
                              ✓ {videoUpload.file.name}
                            </Text>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={removeVideoUpload}
                              className="mt-1"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                        {videoUpload.error && (
                          <Text className="text-red-400 text-sm mt-2 text-center">
                            {videoUpload.error}
                          </Text>
                        )}
                      </div>
                    </HStack>
                  </FormControl>

                  {/* Submit Button */}
                  <HStack justify="space-between" pt={4}>
                    <Link href="/prompts/today">
                      <Button variant="ghost" colorScheme="purple" size="lg">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 px-8 py-3 font-semibold shadow-xl"
                      isLoading={submitting}
                      loadingText="Submitting..."
                      leftIcon={<Upload size={20} />}
                    >
                      Submit Response
                    </Button>
                  </HStack>
                </VStack>
              </div>
            </form>
          </MotionBox>
        </VStack>
      </Container>
    </div>
  )
}