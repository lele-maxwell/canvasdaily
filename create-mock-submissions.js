const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMockSubmissions() {
  try {
    console.log('🎨 Creating mock submissions...');

    // First, get all prompts and users
    const prompts = await prisma.prompt.findMany({
      include: { category: true }
    });
    
    if (prompts.length === 0) {
      console.log('❌ No prompts found. Please run create-test-prompts.js first');
      return;
    }
    
    // Create multiple test users for submissions
    const testUsers = [
      { name: 'Creative Artist', email: 'artist@example.com' },
      { name: 'Digital Designer', email: 'designer@example.com' },
      { name: 'Photography Enthusiast', email: 'photographer@example.com' },
      { name: 'Urban Explorer', email: 'explorer@example.com' },
      { name: 'Nature Lover', email: 'nature@example.com' },
      { name: 'Color Theorist', email: 'colorist@example.com' },
      { name: 'Light Chaser', email: 'lightchaser@example.com' },
      { name: 'Story Teller', email: 'storyteller@example.com' }
    ];

    console.log('👥 Creating test users...');
    const allUsers = [];
    
    for (const userData of testUsers) {
      try {
        const user = await prisma.user.upsert({
          where: { email: userData.email },
          update: {},
          create: {
            name: userData.name,
            email: userData.email,
            password: 'hashedpassword123',
            role: 'USER'
          }
        });
        allUsers.push(user);
      } catch (error) {
        // User might already exist, get existing user
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        if (existingUser) {
          allUsers.push(existingUser);
        }
      }
    }
    
    console.log(`✅ Created/found ${allUsers.length} users`);
    
    // Mock submission data for different types
    const mockSubmissions = [
      // Text submissions
      {
        type: 'TEXT',
        textContent: 'The morning light filtered through my window like liquid gold, casting dancing shadows on the wall. I watched as the world slowly awakened, each ray of sunlight bringing new possibilities. There\'s something magical about those quiet moments before the day begins - when creativity flows freely and inspiration strikes like lightning.',
        title: 'Golden Hour Reflections'
      },
      {
        type: 'TEXT',
        textContent: 'In the heart of the city, stories unfold on every corner. The businessman rushing to catch his train, the street artist painting dreams on concrete walls, the elderly woman feeding pigeons in the park. Each person carries a universe of experiences, hopes, and memories. Urban life is a tapestry woven from countless individual threads.',
        title: 'City Stories Unveiled'
      },
      {
        type: 'TEXT',
        textContent: 'Nature speaks in patterns - the spiral of a seashell, the hexagonal perfection of a honeycomb, the fractal branches of a tree reaching toward the sky. These designs have inspired artists and architects for centuries, reminding us that beauty follows mathematical principles found throughout the natural world.',
        title: 'Nature\'s Blueprint'
      },
      
      // Image submissions (using placeholder URLs)
      {
        type: 'IMAGE',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        title: 'Sunset Over the Mountains',
        description: 'Captured this breathtaking sunset during my hiking trip. The colors were absolutely incredible - from deep purples to brilliant oranges and golds.'
      },
      {
        type: 'IMAGE',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        title: 'Urban Architecture Study',
        description: 'The interplay of light and shadow on this modern building facade creates fascinating geometric patterns throughout the day.'
      },
      {
        type: 'IMAGE',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
        title: 'Forest Path Discovery',
        description: 'Found this hidden trail during my morning walk. The way the light filters through the canopy creates a natural cathedral of green.'
      },
      
      // Text + Image combinations
      {
        type: 'TEXT_IMAGE',
        textContent: 'Blue has always been my favorite color - it represents tranquility, depth, and infinite possibilities. This photo captures how blue can evoke feelings of peace and contemplation. In my art, I use blue to create spaces where viewers can pause and reflect, finding their own emotional connection to the work.',
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
        title: 'Color Psychology in Action',
        description: 'Exploring the emotional impact of color in visual art'
      },
      {
        type: 'TEXT_IMAGE',
        textContent: 'Every morning, I spend a few minutes observing how light transforms ordinary objects into something extraordinary. This simple scene - a cup of coffee on my windowsill - becomes a study in warmth, shadow, and the gentle promise of a new day. Light is the artist\'s most powerful tool.',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        title: 'Morning Light Study',
        description: 'Daily observations on how light transforms the ordinary'
      }
    ];

    // Create submissions for each prompt
    let submissionCount = 0;
    
    for (const prompt of prompts) {
      // Create 2-3 submissions per prompt, ensuring unique user-prompt combinations
      const numSubmissions = Math.min(Math.floor(Math.random() * 2) + 2, allUsers.length); // 2-3 submissions, but not more than available users
      const usedUsers = new Set(); // Track users already used for this prompt
      
      for (let i = 0; i < numSubmissions; i++) {
        const randomSubmission = mockSubmissions[Math.floor(Math.random() * mockSubmissions.length)];
        
        // Find a user that hasn't submitted to this prompt yet
        let randomUser;
        let attempts = 0;
        do {
          randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
          attempts++;
        } while (usedUsers.has(randomUser.id) && attempts < 20);
        
        if (usedUsers.has(randomUser.id)) {
          console.log(`⚠️ Skipping duplicate submission for prompt ${prompt.title}`);
          continue;
        }
        
        usedUsers.add(randomUser.id);
        
        // Create submission with proper field mapping
        const submissionData = {
          type: randomSubmission.type,
          title: randomSubmission.title,
          description: randomSubmission.description || null,
          promptId: prompt.id,
          userId: randomUser.id,
          submittedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time within last 24 hours
          status: 'APPROVED', // Set as approved so they show up
          isPublic: true,
          likes: Math.floor(Math.random() * 20), // Random likes 0-19
          views: Math.floor(Math.random() * 100) // Random views 0-99
        };

        // Add type-specific content
        if (randomSubmission.textContent) {
          submissionData.textContent = randomSubmission.textContent;
        }
        if (randomSubmission.imageUrl) {
          submissionData.imageUrl = randomSubmission.imageUrl;
        }

        await prisma.submission.create({
          data: submissionData
        });
        
        submissionCount++;
      }
    }

    console.log(`✅ Created ${submissionCount} mock submissions successfully!`);
    console.log(`📊 Submissions distributed across ${prompts.length} prompts`);
    
    // Show summary
    const totalSubmissions = await prisma.submission.count();
    console.log(`📈 Total submissions in database: ${totalSubmissions}`);
    
    // Show submissions by type
    const submissionsByType = await prisma.submission.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });
    
    console.log('\n📋 Submissions by type:');
    submissionsByType.forEach(({ type, _count }) => {
      console.log(`   ${type}: ${_count.type} submissions`);
    });

  } catch (error) {
    console.error('❌ Error creating mock submissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMockSubmissions();