const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createPrompt() {
  try {
    // Get the Photography category
    const photoCategory = await prisma.category.findFirst({
      where: { name: 'Photography' }
    })
    
    if (!photoCategory) {
      console.log('Photography category not found')
      return
    }

    // Create the prompt
    const prompt = await prisma.prompt.create({
      data: {
        title: 'Ephemeral Beauty',
        description: 'Capture something beautiful that exists only for a moment - morning dew on a spider\'s web, steam rising from your coffee, shadows dancing on a wall, or the fleeting expression on someone\'s face. Show us the magic in moments that slip away before we notice.',
        categoryId: photoCategory.id,
        scheduledFor: new Date(), // Active now
        isActive: true,
        createdBy: 'temp-admin-id'
      },
      include: {
        category: true,
        _count: {
          select: { submissions: true }
        }
      }
    })

    console.log('✅ Created prompt:', prompt.title)
    console.log('📅 Scheduled for:', prompt.scheduledFor)
    console.log('🎨 Category:', prompt.category.name)
  } catch (error) {
    console.error('❌ Error creating prompt:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPrompt()