import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSchedulingConfig, calculateCurrentPrompt } from '@/lib/scheduling-config'

// GET /api/submissions/current - Get submissions for the current active prompt
export async function GET() {
  try {
    // Get scheduling config
    const config = getSchedulingConfig();
    if (!config.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Prompt scheduling is not active. Admin must configure and activate scheduling.',
        data: []
      });
    }

    // Get all active prompts ordered by scheduledFor
    const prompts = await prisma.prompt.findMany({
      where: { isActive: true },
      orderBy: { scheduledFor: 'asc' }
    });

    if (prompts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No active prompt found'
      });
    }

    // Calculate current prompt using the scheduling configuration
    const { promptIndex } = calculateCurrentPrompt(prompts.length);
    if (promptIndex === -1 || promptIndex >= prompts.length) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No current prompt available'
      });
    }

    const currentPrompt = prompts[promptIndex];

    // Get submissions for the current prompt
    const submissions = await prisma.submission.findMany({
      where: {
        promptId: currentPrompt.id,
        isPublic: true,
        status: 'APPROVED' // Only show approved submissions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 20 // Limit to 20 most recent submissions
    });

    // Transform the data to match the frontend interface
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      type: submission.type,
      title: submission.title,
      description: submission.description,
      textContent: submission.textContent,
      imageUrl: submission.imageUrl,
      videoUrl: submission.videoUrl,
      thumbnailUrl: submission.thumbnailUrl,
      likes: submission.likes,
      views: submission.views,
      submittedAt: submission.submittedAt.toISOString(),
      user: submission.user
    }));

    return NextResponse.json({
      success: true,
      data: transformedSubmissions,
      promptId: currentPrompt.id
    });
  } catch (error) {
    console.error('Error fetching current submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}