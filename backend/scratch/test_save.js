const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const data = {
      rrfNo: 'RFP-TEST-001',
      requestor: 'Admin',
      dateRequested: '2026-05-04',
      dateNeeded: '2026-05-10',
      to: 'Test Recipient',
      from: 'Test Sender',
      department: 'IT',
      company: 'HDI',
      remarks: 'Test Purpose',
      preparedBy: 'Admin',
      status: 'Pending',
      authorId: 2,
      layout: JSON.stringify({ test: 'data' })
    };

    const result = await prisma.rrf.create({ data });
    console.log('Success:', result);
    process.exit(0);
  } catch (e) {
    console.error('Save Error:', e);
    process.exit(1);
  }
}

main();
