import { prisma } from './db';

export interface PromptSchedulerConfig {
  intervalMinutes: number; // For testing: 2 minutes, Production: 1440 (24 hours)
}

export class PromptScheduler {
  private config: PromptSchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: PromptSchedulerConfig = { intervalMinutes: 2 }) {
    this.config = config;
  }

  /**
   * Start the prompt scheduler
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️ Prompt scheduler is already running');
      return;
    }

    console.log(`🚀 Starting prompt scheduler (every ${this.config.intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.processScheduledPrompts();
    
    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.processScheduledPrompts();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the prompt scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Prompt scheduler stopped');
    }
  }

  /**
   * Process scheduled prompts - activate new ones and deactivate old ones
   */
  private async processScheduledPrompts() {
    try {
      console.log('🔄 Processing scheduled prompts...');
      
      const now = new Date();
      
      // Get the current time window (for 2-minute intervals)
      const windowStart = new Date(now);
      windowStart.setSeconds(0, 0); // Round to nearest minute
      
      const windowEnd = new Date(windowStart);
      windowEnd.setMinutes(windowEnd.getMinutes() + this.config.intervalMinutes);
      
      console.log(`⏰ Current window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

      // Find prompts that should be activated in this time window
      const promptsToActivate = await prisma.prompt.findMany({
        where: {
          scheduledFor: {
            gte: windowStart,
            lt: windowEnd
          },
          isActive: false
        },
        include: {
          category: true,
          creator: {
            select: { id: true, name: true }
          }
        }
      });

      // Find currently active prompts that should be deactivated
      const activePrompts = await prisma.prompt.findMany({
        where: {
          isActive: true,
          scheduledFor: {
            lt: windowStart // Prompts scheduled before current window
          }
        }
      });

      // Deactivate old prompts
      if (activePrompts.length > 0) {
        await prisma.prompt.updateMany({
          where: {
            id: { in: activePrompts.map(p => p.id) }
          },
          data: { isActive: false }
        });
        
        console.log(`⏸️ Deactivated ${activePrompts.length} old prompts`);
      }

      // Activate new prompts
      if (promptsToActivate.length > 0) {
        await prisma.prompt.updateMany({
          where: {
            id: { in: promptsToActivate.map(p => p.id) }
          },
          data: { isActive: true }
        });

        console.log(`✅ Activated ${promptsToActivate.length} new prompts:`);
        promptsToActivate.forEach(prompt => {
          console.log(`   - "${prompt.title}" (${prompt.category.name})`);
        });
      } else {
        console.log('📝 No new prompts to activate in this window');
      }

      // Log current active prompts
      const currentActive = await prisma.prompt.count({
        where: { isActive: true }
      });
      console.log(`📊 Currently active prompts: ${currentActive}`);

    } catch (error) {
      console.error('❌ Error processing scheduled prompts:', error);
    }
  }

  /**
   * Get the next scheduled prompt
   */
  async getNextScheduledPrompt() {
    const now = new Date();
    
    return await prisma.prompt.findFirst({
      where: {
        scheduledFor: { gt: now },
        isActive: false
      },
      orderBy: { scheduledFor: 'asc' },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true }
        }
      }
    });
  }

  /**
   * Get currently active prompts
   */
  async getCurrentActivePrompts() {
    return await prisma.prompt.findMany({
      where: { isActive: true },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });
  }

  /**
   * Schedule a new prompt for the next available slot
   */
  async schedulePrompt(promptData: {
    title: string;
    description: string;
    categoryId: string;
    createdBy: string;
    tags?: string[];
  }) {
    // Find the next available time slot
    const lastScheduled = await prisma.prompt.findFirst({
      orderBy: { scheduledFor: 'desc' }
    });

    let nextSlot = new Date();
    if (lastScheduled) {
      nextSlot = new Date(lastScheduled.scheduledFor);
      nextSlot.setMinutes(nextSlot.getMinutes() + this.config.intervalMinutes);
    } else {
      // If no prompts exist, schedule for the next interval
      nextSlot.setMinutes(nextSlot.getMinutes() + this.config.intervalMinutes);
      nextSlot.setSeconds(0, 0);
    }

    return await prisma.prompt.create({
      data: {
        title: promptData.title,
        description: promptData.description,
        categoryId: promptData.categoryId,
        createdBy: promptData.createdBy,
        tags: promptData.tags ? JSON.stringify(promptData.tags) : null,
        scheduledFor: nextSlot,
        isActive: false
      },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true }
        }
      }
    });
  }
}

// Global scheduler instance
export const promptScheduler = new PromptScheduler({
  intervalMinutes: process.env.NODE_ENV === 'production' ? 1440 : 2 // 24 hours in prod, 2 minutes in dev
});