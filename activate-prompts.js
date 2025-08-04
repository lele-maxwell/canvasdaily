const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activatePrompts() {
  try {
    console.log('🔍 Checking prompts...');
    
    const allPrompts = await prisma.prompt.findMany({
      select: { id: true, title: true, isActive: true }
    });
    
    console.log('📊 Found', allPrompts.length, 'total prompts');
    
    const activeCount = allPrompts.filter(p => p.isActive).length;
    console.log('✅ Currently active:', activeCount);
    console.log('❌ Currently inactive:', allPrompts.length - activeCount);
    
    if (activeCount === allPrompts.length) {
      console.log('🎉 All prompts are already active!');
      return;
    }
    
    console.log('🔄 Activating all prompts...');
    
    const updateResult = await prisma.prompt.updateMany({
      data: { isActive: true }
    });
    
    console.log('✅ Updated', updateResult.count, 'prompts');
    
    // Verify the update
    const verifyPrompts = await prisma.prompt.findMany({
      where: { isActive: true },
      select: { title: true }
    });
    
    console.log('🎯 Active prompts now:');
    verifyPrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activatePrompts();