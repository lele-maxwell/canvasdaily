import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface CategoryWithCount {
  id: string;
  name: string;
  color: string;
  _count: {
    prompts: number;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all stats in parallel for better performance
    const [
      totalUsers,
      totalPrompts,
      totalSubmissions,
      activePrompts,
      recentActivity
    ] = await Promise.all([
      // Total registered users
      prisma.user.count(),
      
      // Total prompts created
      prisma.prompt.count(),
      
      // Total submissions
      prisma.submission.count(),
      
      // Active prompts (scheduled for today or future)
      prisma.prompt.count({
        where: {
          isActive: true,
          scheduledFor: {
            gte: new Date()
          }
        }
      }),
      
      // Recent activity (last 7 days)
      prisma.submission.count({
        where: {
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get category distribution
    const categoryStats = await prisma.promptCategory.findMany({
      include: {
        _count: {
          select: { prompts: true }
        }
      }
    });

    // Get recent submissions for activity feed
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        },
        prompt: {
          select: { id: true, title: true }
        }
      }
    });

    const stats = {
      totalUsers,
      totalPrompts,
      totalSubmissions,
      activePrompts,
      recentActivity,
      categoryStats: categoryStats.map((cat: CategoryWithCount) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        promptCount: cat._count.prompts
      })),
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub.id,
        user: sub.user,
        prompt: sub.prompt,
        submittedAt: sub.submittedAt,
        mediaUrl: sub.mediaUrl
      }))
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}