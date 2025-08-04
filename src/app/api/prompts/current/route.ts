import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSchedulingConfig, calculateCurrentPrompt } from '@/lib/scheduling-config';

// GET /api/prompts/current - Get current active prompt with automatic rotation
export async function GET() {
  try {
    // Check if scheduling is active
    const config = getSchedulingConfig();
    if (!config.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Prompt scheduling is not active. Admin must configure and activate scheduling.',
        data: null
      });
    }

    // Get all active prompts ordered by scheduledFor
    const prompts = await prisma.prompt.findMany({
      where: { isActive: true },
      orderBy: { scheduledFor: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true }
        },
        creator: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
    });

    // If no prompts exist, return null
    if (prompts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active prompts found. Admin must create and schedule prompts.',
        data: null
      });
    }

    // Calculate current prompt using the scheduling configuration
    const { promptIndex, currentIntervalStart, currentIntervalEnd } = calculateCurrentPrompt(prompts.length);
    
    // If promptIndex is -1, no valid prompt
    if (promptIndex === -1 || promptIndex >= prompts.length) {
      return NextResponse.json({
        success: false,
        message: 'No current prompt available',
        data: null
      });
    }

    const currentPrompt = prompts[promptIndex];

    // Transform allowedTypes from string to array
    const transformedPrompt = {
      ...currentPrompt,
      allowedTypes: currentPrompt.allowedTypes && typeof currentPrompt.allowedTypes === 'string'
        ? currentPrompt.allowedTypes.split(',').map((type: string) => type.trim())
        : [],
      // Add timing information for the frontend
      currentIntervalStart: currentIntervalStart.toISOString(),
      currentIntervalEnd: currentIntervalEnd.toISOString(),
      promptIndex,
      totalPrompts: prompts.length,
      schedulingConfig: {
        intervalMinutes: config.intervalMinutes,
        isActive: config.isActive,
        baseTime: config.baseTime
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedPrompt
    });
  } catch (error) {
    console.error('Error fetching current prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current prompt' },
      { status: 500 }
    );
  }
}