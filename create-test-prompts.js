const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestPrompts() {
  try {
    console.log('🔄 Creating test prompts...');
    
    // Get existing admin and category
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const category = await prisma.promptCategory.findFirst({});
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    if (!category) {
      console.log('❌ Category not found');
      return;
    }

    console.log(`✅ Found admin: ${admin.email}`);
    console.log(`✅ Found category: ${category.name}`);

    // Delete existing prompts first
    await prisma.prompt.deleteMany({});
    console.log('🗑️ Cleared existing prompts');

    // Create test prompts
    const prompts = [
      {
        title: 'Morning Light Study',
        description: 'Capture the beauty of morning light in your creative medium. Focus on how light transforms ordinary objects.',
        tags: 'morning,light,study'
      },
      {
        title: 'Urban Stories',
        description: 'Tell a story about city life through your art. What stories do the streets whisper?',
        tags: 'urban,stories,city'
      },
      {
        title: 'Nature Patterns',
        description: 'Find and showcase patterns in nature. From leaf veins to cloud formations.',
        tags: 'nature,patterns,organic'
      },
      {
        title: 'Color Emotions',
        description: 'Express emotions through color choices. How do colors make you feel?',
        tags: 'color,emotions,feelings'
      }
    ];

    const now = new Date();
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = await prisma.prompt.create({
        data: {
          title: prompts[i].title,
          description: prompts[i].description,
          categoryId: category.id,
          tags: prompts[i].tags,
          scheduledFor: new Date(now.getTime() + i * 1000), // Stagger by 1 second
          isActive: true,
          createdBy: admin.id,
          allowedTypes: 'TEXT,IMAGE,TEXT_IMAGE'
        }
      });
      console.log(`✅ Created: ${prompt.title}`);
    }

    console.log('\n🎉 Successfully created 4 test prompts!');
    console.log('🔄 Prompts will rotate every 2 minutes in this order:');
    prompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title}`);
    });
    console.log('🔁 After Prompt 4, it will cycle back to Prompt 1');
    
  } catch (error) {
    console.error('❌ Error creating prompts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPrompts();