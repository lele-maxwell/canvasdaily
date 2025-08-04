import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/prompts/[id] - Get single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: prompt
    })
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompt' },
      { status: 500 }
    )
  }
}

// PUT /api/prompts/[id] - Update prompt (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, categoryId, tags, scheduledFor, isActive } = body

    // Check if prompt exists
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id: params.id }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null
    if (scheduledFor !== undefined) updateData.scheduledFor = new Date(scheduledFor)
    if (isActive !== undefined) updateData.isActive = isActive

    const prompt = await prisma.prompt.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update prompt' },
      { status: 500 }
    )
  }
}

// DELETE /api/prompts/[id] - Delete prompt (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if prompt exists
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id: params.id }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Delete the prompt (this will cascade delete submissions due to schema)
    await prisma.prompt.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
}