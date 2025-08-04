const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrompts() {
  try {
    console.log('=== CHECKING PROMPTS IN DATABASE ===');
    
    // Get all prompts
    const allPrompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        isActive: true,
        scheduledFor: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Total prompts in database: ${allPrompts.length}`);
    console.log('');
    
    allPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.title}`);
      console.log(`   ID: ${prompt.id}`);
      console.log(`   Active: ${prompt.isActive}`);
      console.log(`   Scheduled: ${prompt.scheduledFor}`);
      console.log('');
    });
    
    // Count active vs inactive
    const activeCount = allPrompts.filter(p => p.isActive).length;
    const inactiveCount = allPrompts.filter(p => !p.isActive).length;
    
    console.log(`Active prompts: ${activeCount}`);
    console.log(`Inactive prompts: ${inactiveCount}`);
    
    if (activeCount < 3) {
      console.log('\n=== ACTIVATING MORE PROMPTS ===');
      
      // Get first 5 inactive prompts and activate them
      const inactivePrompts = allPrompts.filter(p => !p.isActive).slice(0, 5);
      
      for (let i = 0; i < inactivePrompts.length; i++) {
        const prompt = inactivePrompts[i];
        console.log(`Activating: ${prompt.title}`);
        
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { isActive: true }
        });
      }
      
      console.log(`Activated ${inactivePrompts.length} additional prompts`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrompts();