// =============================================================================
// File: backend/prisma/seed.ts
// Purpose: Seed the database with initial admin user and sample programs
// Dependencies: @prisma/client, bcrypt
// Run: npm run db:seed
// =============================================================================

import { PrismaClient, Role, ProgramDuration } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('\n🌱 Starting database seed...\n');

  // ── 1. Admin User ────────────────────────────────────────────────────────────
  const adminEmail = 'admin@interntrack.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash('Admin@1234', 12),
        role: Role.ADMIN,
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
      },
    });
    console.log('✅ Admin created     → admin@interntrack.com / Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── 2. Sample Mentor ─────────────────────────────────────────────────────────
  const mentorEmail = 'mentor@interntrack.com';
  const mentorExists = await prisma.user.findUnique({ where: { email: mentorEmail } });

  if (!mentorExists) {
    await prisma.user.create({
      data: {
        email: mentorEmail,
        password: await bcrypt.hash('Mentor@1234', 12),
        role: Role.MENTOR,
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        mentorProfile: {
          create: {
            expertise: 'Full-Stack Development',
            department: 'Engineering',
            bio: 'Senior engineer with 8 years of experience in web development.',
          },
        },
      },
    });
    console.log('✅ Mentor created     → mentor@interntrack.com / Mentor@1234');
  } else {
    console.log('ℹ️  Mentor already exists');
  }

  // ── 3. Internship Programs ───────────────────────────────────────────────────
  const programs = [
    {
      title: 'Web Development Internship',
      description:
        'A comprehensive internship covering modern web development with React, Node.js, and databases. Interns will build real-world projects under mentor guidance.',
      duration: ProgramDuration.ONE_MONTH,
      reqHours: 40,
    },
    {
      title: 'Data Science & ML Internship',
      description:
        'Explore data analysis, machine learning models, and AI applications. Work with Python, pandas, and scikit-learn to solve real-world problems.',
      duration: ProgramDuration.THREE_MONTHS,
      reqHours: 40,
    },
    {
      title: 'UI/UX Design Internship',
      description:
        'Learn user-centered design principles, Figma, prototyping, and usability testing. Build a design portfolio with real projects.',
      duration: ProgramDuration.ONE_MONTH,
      reqHours: 40,
    },
    {
      title: 'Cloud & DevOps Internship',
      description:
        'Gain hands-on experience with AWS, Docker, CI/CD pipelines, and infrastructure-as-code. Work on deploying and managing cloud applications.',
      duration: ProgramDuration.THREE_MONTHS,
      reqHours: 40,
    },
  ];

  for (const program of programs) {
    const exists = await prisma.internshipProgram.findFirst({
      where: { title: program.title },
    });
    if (!exists) {
      await prisma.internshipProgram.create({ data: program });
      console.log(`✅ Program created    → ${program.title}`);
    } else {
      console.log(`ℹ️  Program exists     → ${program.title}`);
    }
  }

  console.log('\n✅ Database seeding complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log('📧 Admin  : admin@interntrack.com / Admin@1234');
  console.log('📧 Mentor : mentor@interntrack.com / Mentor@1234');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally((): void => {
    void prisma.$disconnect();
  });
