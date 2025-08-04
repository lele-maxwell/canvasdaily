import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/submissions - Get submissions with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const promptId = searchParams.get('promptId')
    const userId = searchParams.get('userId')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      isPublic: true // Only show public submissions by default
    }
    
    if (promptId) {
      where.promptId = promptId
    }
    
    if (userId) {
      where.userId = userId
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true }
          },
          prompt: {
            select: { id: true, title: true, category: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST /api/submissions - Create new submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      promptId,
      title,
      description,
      textContent,
      type: submissionType,
      imageUrl,
      videoUrl,
      isPublic = true
    } = body

    if (!promptId) {
      return NextResponse.json(
        { success: false, error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    if (!submissionType) {
      return NextResponse.json(
        { success: false, error: 'Submission type is required' },
        { status: 400 }
      )
    }

    // Check if user already submitted for this prompt
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted for this prompt' },
        { status: 400 }
      )
    }

    // Verify prompt exists and is active
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId }
    })

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      )
    }

    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        promptId,
        type: submissionType,
        title: title?.trim() || null,
        description: description?.trim() || null,
        textContent: textContent?.trim() || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        isPublic,
        status: 'APPROVED', // Auto-approve for now, can be changed later
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        },
        prompt: {
          select: { id: true, title: true, category: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}