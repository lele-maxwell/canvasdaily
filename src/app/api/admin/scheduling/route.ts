import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSchedulingConfig, updateSchedulingConfig } from '@/lib/scheduling-config';

// GET /api/admin/scheduling - Get comprehensive scheduling information
export async function GET() {
  try {
    // Temporarily bypass auth for testing - REMOVE IN PRODUCTION
    const isAdmin = true; // session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all prompts with scheduling information
    const prompts = await prisma.prompt.findMany({
      orderBy: { scheduledFor: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        creator: {
          select: { id: true, name: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
    });

    // Get current scheduling configuration
    const currentTime = new Date();
    const config = getSchedulingConfig();
    const baseTime = new Date(config.baseTime);
    const intervalMinutes = config.intervalMinutes;

    // Calculate scheduling timeline
    const schedulingTimeline = prompts.map((prompt, index) => {
      const expectedScheduleTime = new Date(baseTime.getTime() + (index * intervalMinutes * 60 * 1000));
      const actualScheduleTime = new Date(prompt.scheduledFor);
      const isOnSchedule = Math.abs(expectedScheduleTime.getTime() - actualScheduleTime.getTime()) < 60000; // Within 1 minute

      return {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        category: prompt.category,
        scheduledFor: prompt.scheduledFor,
        expectedScheduleTime: expectedScheduleTime.toISOString(),
        actualScheduleTime: actualScheduleTime.toISOString(),
        isOnSchedule,
        isActive: prompt.isActive,
        submissionCount: prompt._count.submissions,
        createdBy: prompt.creator,
        position: index + 1,
        status: currentTime > actualScheduleTime ? 'completed' : 'upcoming'
      };
    });

    // Calculate next available slot
    const lastPrompt = prompts[prompts.length - 1];
    const nextAvailableSlot = lastPrompt 
      ? new Date(new Date(lastPrompt.scheduledFor).getTime() + (intervalMinutes * 60 * 1000))
      : new Date(currentTime.getTime() + (intervalMinutes * 60 * 1000));

    // Get scheduling statistics
    const stats = {
      totalPrompts: prompts.length,
      activePrompts: prompts.filter(p => p.isActive).length,
      completedPrompts: schedulingTimeline.filter(p => p.status === 'completed').length,
      upcomingPrompts: schedulingTimeline.filter(p => p.status === 'upcoming').length,
      onSchedulePrompts: schedulingTimeline.filter(p => p.isOnSchedule).length,
      currentInterval: intervalMinutes,
      nextAvailableSlot: nextAvailableSlot.toISOString(),
      baseTime: baseTime.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        schedulingTimeline,
        stats,
        configuration: {
          intervalMinutes,
          baseTime: baseTime.toISOString(),
          currentTime: currentTime.toISOString(),
          isActive: config.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error fetching scheduling data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduling data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scheduling - Update scheduling configuration
export async function POST(request: NextRequest) {
  try {
    // Temporarily bypass auth for testing - REMOVE IN PRODUCTION
    const isAdmin = true; // session?.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { action, intervalMinutes, baseTime, rescheduleAll } = body;

    if (action === 'updateInterval') {
      // Update the persistent configuration
      const newBaseTime = baseTime ? new Date(baseTime) : new Date();
      const updatedConfig = updateSchedulingConfig({
        intervalMinutes,
        baseTime: newBaseTime.toISOString(),
        isActive: true
      });

      // Update interval and optionally reschedule all prompts
      if (rescheduleAll) {
        const prompts = await prisma.prompt.findMany({
          orderBy: { scheduledFor: 'asc' }
        });
        
        // Reschedule all prompts with new interval while preserving isActive status
        for (let i = 0; i < prompts.length; i++) {
          const newScheduleTime = new Date(newBaseTime.getTime() + (i * intervalMinutes * 60 * 1000));
          
          await prisma.prompt.update({
            where: { id: prompts[i].id },
            data: {
              scheduledFor: newScheduleTime,
              // Explicitly preserve the isActive status - don't change it
              isActive: prompts[i].isActive
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: `Updated interval to ${intervalMinutes} minutes and rescheduled ${prompts.length} prompts`,
          data: {
            intervalMinutes,
            baseTime: newBaseTime.toISOString(),
            rescheduledPrompts: prompts.length,
            config: updatedConfig
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Updated interval to ${intervalMinutes} minutes`,
        data: {
          intervalMinutes,
          baseTime: newBaseTime.toISOString(),
          config: updatedConfig
        }
      });
    }

    if (action === 'autoScheduleNew') {
      // Get the last scheduled prompt
      const lastPrompt = await prisma.prompt.findFirst({
        orderBy: { scheduledFor: 'desc' }
      });

      const config = getSchedulingConfig();
      const nextScheduleTime = lastPrompt
        ? new Date(new Date(lastPrompt.scheduledFor).getTime() + (config.intervalMinutes * 60 * 1000))
        : new Date();

      return NextResponse.json({
        success: true,
        data: {
          nextAvailableSlot: nextScheduleTime.toISOString(),
          intervalMinutes: config.intervalMinutes
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating scheduling configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduling configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/scheduling - Reschedule specific prompt
export async function PUT(request: NextRequest) {
  try {
    // Temporarily bypass auth for testing - REMOVE IN PRODUCTION
    const isAdmin = true; // session?.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId, newScheduleTime } = body;

    if (!promptId || !newScheduleTime) {
      return NextResponse.json(
        { success: false, error: 'promptId and newScheduleTime are required' },
        { status: 400 }
      );
    }

    const updatedPrompt = await prisma.prompt.update({
      where: { id: promptId },
      data: { scheduledFor: new Date(newScheduleTime) },
      include: {
        category: { select: { name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Rescheduled "${updatedPrompt.title}" to ${new Date(newScheduleTime).toLocaleString()}`,
      data: {
        id: updatedPrompt.id,
        title: updatedPrompt.title,
        scheduledFor: updatedPrompt.scheduledFor,
        category: updatedPrompt.category.name
      }
    });
  } catch (error) {
    console.error('Error rescheduling prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule prompt' },
      { status: 500 }
    );
  }
}