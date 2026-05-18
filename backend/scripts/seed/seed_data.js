const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Drivers...');
  const drivers = [
    { name: 'John Doe', status: 'Active' },
    { name: 'Jane Smith', status: 'Active' },
    { name: 'Robert Fox', status: 'On Leave' },
  ];
  for (const d of drivers) {
    await prisma.driver.create({ data: d });
  }

  console.log('Seeding Vehicles...');
  const vehicles = [
    { name: 'Toyota Fortuner', plateNumber: 'ABC 1234', brand: 'Toyota', status: 'Active' },
    { name: 'Mitsubishi Montero', plateNumber: 'XYZ 7890', brand: 'Mitsubishi', status: 'Active' },
    { name: 'Isuszu D-Max', plateNumber: 'DEF 5678', brand: 'Isuzu', status: 'Under Maintenance' },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.create({ data: v });
  }

  console.log('Seeding Sample Trip Tickets...');
  const admin = await prisma.user.findFirst({ where: { email: 'admin' } });
  if (admin) {
    for (let i = 1; i <= 5; i++) {
      await prisma.tripTicket.create({
        data: {
          requestorName: 'Employee ' + i,
          destination: 'Destination ' + i,
          purpose: 'Official Business',
          status: i % 2 === 0 ? 'Approved' : 'Pending',
          authorId: admin.id,
          dateRequested: new Date().toISOString().split('T')[0],
        }
      });
    }
  }

  console.log('Seeding Sample PRFs...');
  if (admin) {
    for (let i = 1; i <= 3; i++) {
      await prisma.prf.create({
        data: {
          requestor: 'Requestor ' + i,
          department: 'IT Department',
          remarks: 'Urgent purchase',
          status: 'Pending',
          authorId: admin.id,
          dateRequested: new Date().toISOString().split('T')[0],
        }
      });
    }
  }

  console.log('✅ Sample data seeded successfully!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
