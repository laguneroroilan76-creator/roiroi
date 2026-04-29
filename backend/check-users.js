const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('All Users:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
