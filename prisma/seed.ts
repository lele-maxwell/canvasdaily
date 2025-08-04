const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create prompt categories using upsert to handle existing data
  const categories = await Promise.all([
    prisma.promptCategory.upsert({
      where: { name: 'Drawing & Illustration' },
      update: {},
      create: {
        name: 'Drawing & Illustration',
        description: 'Traditional and digital drawing prompts',
        color: '#ff6b6b',
        icon: 'palette',
      },
    }),
    prisma.promptCategory.upsert({
      where: { name: 'Photography' },
      update: {},
      create: {
        name: 'Photography',
        description: 'Capture the world through your lens',
        color: '#4ecdc4',
        icon: 'camera',
      },
    }),
    prisma.promptCategory.upsert({
      where: { name: 'Creative Writing' },
      update: {},
      create: {
        name: 'Creative Writing',
        description: 'Stories, poems, and creative texts',
        color: '#45b7d1',
        icon: 'pen',
      },
    }),
    prisma.promptCategory.upsert({
      where: { name: 'Mixed Media' },
      update: {},
      create: {
        name: 'Mixed Media',
        description: 'Combine different artistic mediums',
        color: '#f9ca24',
        icon: 'layers',
      },
    }),
  ])

  // Create a test user using upsert
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
      password: hashedPassword,
    },
  })

  // Create an admin user using upsert
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      password: hashedPassword,
    },
  })

  // Create sample prompts with longer intervals for testing
  const now = new Date()
  now.setSeconds(0, 0) // Round to nearest minute
  
  // Create prompts scheduled with longer intervals
  const prompts = await Promise.all([
    // Current prompt (active now) - active for 1 hour
    prisma.prompt.create({
      data: {
        title: 'Urban Sketching',
        description: 'Draw or photograph an interesting architectural detail you encounter in your city. Focus on textures, shadows, and unique design elements.',
        categoryId: categories[0].id,
        tags: JSON.stringify(['architecture', 'urban', 'sketching', 'details']),
        scheduledFor: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago (should be active)
        isActive: true,
        createdBy: adminUser.id,
        allowedTypes: 'TEXT,IMAGE,TEXT_IMAGE',
      },
    }),
    // Next prompt (in 1 hour)
    prisma.prompt.create({
      data: {
        title: 'Color Emotions',
        description: 'Create a piece that expresses a specific emotion using only three colors. Think about how color psychology affects mood and feeling.',
        categoryId: categories[0].id,
        tags: JSON.stringify(['color', 'emotion', 'psychology', 'mood']),
        scheduledFor: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        isActive: false,
        createdBy: adminUser.id,
        allowedTypes: 'TEXT,IMAGE,TEXT_IMAGE',
      },
    }),
    // Prompt in 2 hours
    prisma.prompt.create({
      data: {
        title: 'Golden Hour Magic',
        description: 'Capture the beauty of golden hour light in your medium of choice. Whether photography, painting, or writing, show us how this magical time of day inspires you.',
        categoryId: categories[1].id,
        tags: JSON.stringify(['golden-hour', 'light', 'photography', 'magic']),
        scheduledFor: new Date(now.getTime() + 90 * 60 * 1000), // 1.5 hours from now
        isActive: false,
        createdBy: adminUser.id,
        allowedTypes: 'TEXT,IMAGE,TEXT_IMAGE',
      },
    }),
    // Prompt in 3 hours
    prisma.prompt.create({
      data: {
        title: 'Micro Fiction Challenge',
        description: 'Write a complete story in exactly 55 words. Every word counts! Focus on creating a compelling narrative arc in this ultra-short format.',
        categoryId: categories[2].id,
        tags: JSON.stringify(['micro-fiction', 'writing', 'challenge', 'short-story']),
        scheduledFor: new Date(now.getTime() + 150 * 60 * 1000), // 2.5 hours from now
        isActive: false,
        createdBy: adminUser.id,
        allowedTypes: 'TEXT',
      },
    }),
    // Prompt in 4 hours
    prisma.prompt.create({
      data: {
        title: 'Nature Patterns',
        description: 'Find and capture patterns in nature - from leaf veins to cloud formations. Show us the hidden geometry in the natural world.',
        categoryId: categories[1].id,
        tags: JSON.stringify(['nature', 'patterns', 'geometry', 'photography']),
        scheduledFor: new Date(now.getTime() + 210 * 60 * 1000), // 3.5 hours from now
        isActive: false,
        createdBy: adminUser.id,
        allowedTypes: 'IMAGE,TEXT_IMAGE',
      },
    }),
    // Prompt in 5 hours
    prisma.prompt.create({
      data: {
        title: 'Mixed Media Collage',
        description: 'Create a collage using at least three different materials or mediums. Combine digital and physical elements for a unique artistic expression.',
        categoryId: categories[3].id,
        tags: JSON.stringify(['collage', 'mixed-media', 'digital', 'physical']),
        scheduledFor: new Date(now.getTime() + 270 * 60 * 1000), // 4.5 hours from now
        isActive: false,
        createdBy: adminUser.id,
        allowedTypes: 'ALL',
      },
    }),
  ])

  // Create additional sample users for submissions using upsert
  const sampleUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        role: 'USER',
        password: hashedPassword,
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
      },
    }),
    prisma.user.upsert({
      where: { email: 'marcus@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Marcus Johnson',
        email: 'marcus@example.com',
        role: 'USER',
        password: hashedPassword,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      },
    }),
    prisma.user.upsert({
      where: { email: 'elena@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Elena Rodriguez',
        email: 'elena@example.com',
        role: 'USER',
        password: hashedPassword,
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
      },
    }),
    prisma.user.upsert({
      where: { email: 'david@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'David Kim',
        email: 'david@example.com',
        role: 'USER',
        password: hashedPassword,
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
    }),
  ])

  // Create sample submissions for the active prompt (Urban Sketching)
  const submissions = await Promise.all([
    prisma.submission.create({
      data: {
        userId: sampleUsers[0].id,
        promptId: prompts[0].id, // Urban Sketching prompt
        type: 'TEXT_IMAGE',
        title: 'Morning Dew Architecture',
        description: 'Found this beautiful old building covered in morning dew just as the sun was rising.',
        textContent: 'The intricate stonework of this 19th-century building caught my eye during my morning walk. The way the dew clung to every carved detail made it look like nature was highlighting the craftsmanship of generations past.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        likes: 24,
        views: 156,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    }),
    prisma.submission.create({
      data: {
        userId: sampleUsers[1].id,
        promptId: prompts[0].id, // Urban Sketching prompt
        type: 'TEXT',
        title: 'Steam Stories',
        textContent: 'Walking through the industrial district, I noticed how the steam from the old factory creates ephemeral architectural elements. These temporary columns and arches dance between the permanent structures, creating a dialogue between the solid and the fleeting.',
        likes: 18,
        views: 89,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
    }),
    prisma.submission.create({
      data: {
        userId: sampleUsers[2].id,
        promptId: prompts[0].id, // Urban Sketching prompt
        type: 'IMAGE',
        title: 'Dancing Shadows',
        description: 'Shadows dancing on my wall during golden hour.',
        imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        likes: 31,
        views: 203,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    }),
    prisma.submission.create({
      data: {
        userId: sampleUsers[3].id,
        promptId: prompts[0].id, // Urban Sketching prompt
        type: 'TEXT_IMAGE',
        title: 'Fleeting Expression',
        description: 'The way light plays on this building facade.',
        textContent: 'Architecture isn\'t just about the building itself, but about how it interacts with light, shadow, and time. This facade tells a different story every hour of the day.',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
        likes: 42,
        views: 287,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${categories.length} categories`)
  console.log(`Created ${prompts.length} prompts with longer intervals`)
  console.log(`Created ${2 + sampleUsers.length} users (2 system + ${sampleUsers.length} sample)`)
  console.log(`Created ${submissions.length} sample submissions`)
  console.log('')
  console.log('📅 Prompt Schedule:')
  prompts.forEach((prompt, index) => {
    const timeFromNow = index === 0 ? '30 min ago (active)' :
                       index === 1 ? '30 min from now' :
                       index === 2 ? '1.5 hours from now' :
                       index === 3 ? '2.5 hours from now' :
                       index === 4 ? '3.5 hours from now' :
                       '4.5 hours from now'
    console.log(`   ${prompt.scheduledFor.toLocaleTimeString()} - ${prompt.title} (${timeFromNow})`)
  })
  console.log('')
  console.log('📝 Sample Submissions:')
  submissions.forEach((submission, index) => {
    console.log(`   ${submission.title} by ${sampleUsers[index].name} (${submission.type})`)
  })
  console.log('')
  console.log('🔐 Test Login Credentials:')
  console.log('   Email: test@example.com, Password: password123')
  console.log('   Email: admin@example.com, Password: password123')
  console.log('   Email: sarah@example.com, Password: password123')
  console.log('   Email: marcus@example.com, Password: password123')
  console.log('   Email: elena@example.com, Password: password123')
  console.log('   Email: david@example.com, Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })