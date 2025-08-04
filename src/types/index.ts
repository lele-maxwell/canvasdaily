import { User, Prompt, Submission, PromptCategory } from '@prisma/client'

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT'

// Define enums manually until Prisma client is generated
export enum SubmissionType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT_IMAGE = 'TEXT_IMAGE',
  TEXT_VIDEO = 'TEXT_VIDEO',
  ALL = 'ALL'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED'
}

export interface ExtendedUser extends User {
  role: UserRole
}

export interface PromptWithCategory extends Prompt {
  category: PromptCategory
  _count?: {
    submissions: number
  }
}

export interface SubmissionWithUser extends Submission {
  user: Pick<User, 'id' | 'name' | 'image'>
}

export interface PromptWithSubmissions extends Prompt {
  category: PromptCategory
  submissions: SubmissionWithUser[]
  _count: {
    submissions: number
  }
}

export interface CreatePromptData {
  title: string
  description: string
  categoryId: string
  tags?: string[]
  scheduledFor: Date
  allowedTypes: SubmissionType[]
  maxSubmissions?: number
  submissionDeadline?: Date
}

export interface CreateSubmissionData {
  promptId: string
  type: SubmissionType
  textContent?: string
  imageUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  title?: string
  description?: string
  isPublic?: boolean
}

export interface SubmissionFormData {
  type: SubmissionType
  textContent?: string
  imageFile?: File
  videoFile?: File
  title?: string
  description?: string
  isPublic: boolean
}

export interface FileUploadResponse {
  success: boolean
  fileUrl?: string
  error?: string
}

export interface SignedUploadResponse {
  success: boolean
  uploadUrl?: string
  fileUrl?: string
  error?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PromptFilters {
  categoryId?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  isActive?: boolean
}

export interface DashboardStats {
  totalPrompts: number
  totalSubmissions: number
  totalUsers: number
  todaySubmissions: number
  activePrompt?: PromptWithCategory
}

export interface SubmissionTypeConfig {
  type: SubmissionType
  label: string
  description: string
  icon: string
  color: string
  allowsText: boolean
  allowsImage: boolean
  allowsVideo: boolean
}

export const SUBMISSION_TYPE_CONFIGS: Record<SubmissionType, SubmissionTypeConfig> = {
  [SubmissionType.TEXT]: {
    type: SubmissionType.TEXT,
    label: 'Text Only',
    description: 'Share your thoughts, stories, or written responses',
    icon: '📝',
    color: 'blue',
    allowsText: true,
    allowsImage: false,
    allowsVideo: false,
  },
  [SubmissionType.IMAGE]: {
    type: SubmissionType.IMAGE,
    label: 'Image Only',
    description: 'Upload a photo, artwork, or visual creation',
    icon: '🖼️',
    color: 'green',
    allowsText: false,
    allowsImage: true,
    allowsVideo: false,
  },
  [SubmissionType.VIDEO]: {
    type: SubmissionType.VIDEO,
    label: 'Video Only',
    description: 'Share a video response or creation',
    icon: '🎥',
    color: 'red',
    allowsText: false,
    allowsImage: false,
    allowsVideo: true,
  },
  [SubmissionType.TEXT_IMAGE]: {
    type: SubmissionType.TEXT_IMAGE,
    label: 'Text + Image',
    description: 'Combine written content with visual elements',
    icon: '📝🖼️',
    color: 'purple',
    allowsText: true,
    allowsImage: true,
    allowsVideo: false,
  },
  [SubmissionType.TEXT_VIDEO]: {
    type: SubmissionType.TEXT_VIDEO,
    label: 'Text + Video',
    description: 'Combine written content with video',
    icon: '📝🎥',
    color: 'orange',
    allowsText: true,
    allowsImage: false,
    allowsVideo: true,
  },
  [SubmissionType.ALL]: {
    type: SubmissionType.ALL,
    label: 'Mixed Media',
    description: 'Use any combination of text, images, and video',
    icon: '🎨',
    color: 'gradient',
    allowsText: true,
    allowsImage: true,
    allowsVideo: true,
  },
}

// NextAuth type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    role: UserRole
  }
}