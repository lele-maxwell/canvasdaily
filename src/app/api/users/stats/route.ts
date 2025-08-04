import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total submissions count
    const totalSubmissions = await prisma.submission.count({
      where: { userId }
    });

    // Get submissions with dates for streak calculation
    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: { submittedAt: true },
      orderBy: { submittedAt: 'desc' }
    });

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (submissions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Group submissions by date
      const submissionDates = new Set(
        submissions.map((s: { submittedAt: Date }) => {
          const date = new Date(s.submittedAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      );

      // Calculate current streak
      const checkDate = new Date(today);
      while (submissionDates.has(checkDate.getTime())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Calculate longest streak
      const sortedDates = Array.from(submissionDates).sort((a: number, b: number) => a - b);
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0 || (sortedDates[i] as number) - (sortedDates[i - 1] as number) === 24 * 60 * 60 * 1000) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    // Get favorite category
    const categoryStats = await prisma.submission.groupBy({
      by: ['promptId'],
      where: { userId },
      _count: { promptId: true },
      orderBy: { _count: { promptId: 'desc' } },
      take: 1
    });

    let favoriteCategory = 'None';
    if (categoryStats.length > 0) {
      const topPrompt = await prisma.prompt.findUnique({
        where: { id: categoryStats[0].promptId },
        include: { category: true }
      });
      favoriteCategory = topPrompt?.category.name || 'Mixed';
    }

    const stats = {
      totalSubmissions,
      currentStreak,
      longestStreak,
      favoriteCategory
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}