const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connection successful');
    
    const userCount = await prisma.user.count();
    const ticketCount = await prisma.tripTicket.count();
    const prfCount = await prisma.prf.count();
    const rrfCount = await prisma.rrf.count();
    const vehicleCount = await prisma.vehicle.count();
    const driverCount = await prisma.driver.count();

    console.log('--- Database Stats ---');
    console.log(`Users: ${userCount}`);
    console.log(`Trip Tickets: ${ticketCount}`);
    console.log(`PRFs: ${prfCount}`);
    console.log(`RFPs/RRFs: ${rrfCount}`);
    console.log(`Vehicles: ${vehicleCount}`);
    console.log(`Drivers: ${driverCount}`);
    console.log('----------------------');

  } catch (e) {
    console.error('❌ Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
