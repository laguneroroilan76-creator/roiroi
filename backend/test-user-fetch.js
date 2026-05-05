const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetch() {
  console.log('Testing User Fetch Logic...');
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, email: true, name: true, createdAt: true, 
        canApprove: true, role: true, avatarUrl: true, 
        themeColor: true, isDarkMode: true, permissions: true
      }
    });
    console.log('Successfully fetched users:', users.length);
    console.log('First User:', users[0]);
  } catch (err) {
    console.error('FETCH ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testFetch();
