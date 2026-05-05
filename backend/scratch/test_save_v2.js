const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const data = {
      prfNo: "AUTO-2",
      dateRequested: "2026-05-04",
      status: 'Pending',
      requestor: 'Admin',
      authorId: 2, // Admin ID from check-users.js
      layout: JSON.stringify({ test: true }),
    };

    console.log('Attempting to create PRF with valid authorId: 2');
    const prf = await prisma.prf.create({ data });
    console.log('Successfully created PRF:', prf);
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
