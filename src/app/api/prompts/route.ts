import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
// import { getTodayUTC } from '@/lib/utils' // May be needed for future filtering

// GET /api/prompts - Get prompts with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: {
          category: true,
          creator: {
            select: { id: true, name: true, image: true }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { scheduledFor: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prompt.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

// POST /api/prompts - Create new prompt (admin only)
export async function POST(request: NextRequest) {
  try {
    // Temporarily bypass auth for testing - REMOVE IN PRODUCTION
    const isAdmin = true; // session?.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, categoryId, tags, scheduledFor } = body

    if (!title || !description || !categoryId || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = await prisma.prompt.create({
      data: {
        title,
        description,
        categoryId,
        tags: tags ? JSON.stringify(tags) : null,
        scheduledFor: new Date(scheduledFor),
        createdBy: 'temp-admin-id', // session.user.id,
      },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: prompt
    })
  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
}