import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      scheduledFor: {
        lt: new Date() // Only past prompts
      }
    };

    if (category && category !== 'all') {
      where.category = {
        name: category
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch prompts with submission stats
    const prompts = await prisma.prompt.findMany({
      where,
      include: {
        category: true,
        submissions: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          take: 5 // Get recent submissions for avatars
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { scheduledFor: 'desc' },
      skip,
      take: limit
    });

    // Transform the data
    const transformedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      category: {
        name: prompt.category.name,
        color: prompt.category.color,
        icon: prompt.category.icon
      },
      scheduledFor: prompt.scheduledFor.toISOString(),
      submissionCount: prompt._count.submissions,
      recentSubmissions: prompt.submissions.map(submission => ({
        user: {
          name: submission.user.name || 'Anonymous',
          image: submission.user.image || '/default-avatar.svg'
        }
      }))
    }));

    // Get total count for pagination
    const totalCount = await prisma.prompt.count({ where });

    return NextResponse.json({
      prompts: transformedPrompts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}