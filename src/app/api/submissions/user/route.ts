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

    // Get user's submissions with prompt details
    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        prompt: {
          include: {
            category: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform the data to match the expected format
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      title: submission.description || 'Untitled Submission',
      description: submission.description || '',
      mediaUrl: submission.mediaUrl || '',
      mediaType: submission.mediaType || 'IMAGE',
      createdAt: submission.submittedAt.toISOString(),
      prompt: {
        title: submission.prompt.title,
        category: submission.prompt.category.name
      }
    }));

    return NextResponse.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}