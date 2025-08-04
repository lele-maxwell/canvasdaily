import { NextRequest, NextResponse } from 'next/server';
import { getSchedulingConfig, updateSchedulingConfig } from '@/lib/scheduling-config';

// GET /api/scheduler - Get scheduler status
export async function GET() {
  try {
    const config = getSchedulingConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        isRunning: config.isActive,
        intervalMinutes: config.intervalMinutes,
        baseTime: config.baseTime,
        activePrompts: 0, // Will be calculated from database if needed
        nextPrompt: null,
        currentActivePrompts: []
      }
    });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - Control scheduler (start/stop)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      const updatedConfig = updateSchedulingConfig({ isActive: true });
      
      return NextResponse.json({
        success: true,
        message: 'Scheduler started successfully',
        data: {
          isRunning: updatedConfig.isActive,
          intervalMinutes: updatedConfig.intervalMinutes
        }
      });
    }

    if (action === 'stop') {
      const updatedConfig = updateSchedulingConfig({ isActive: false });
      
      return NextResponse.json({
        success: true,
        message: 'Scheduler stopped successfully',
        data: {
          isRunning: updatedConfig.isActive,
          intervalMinutes: updatedConfig.intervalMinutes
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "start" or "stop"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}