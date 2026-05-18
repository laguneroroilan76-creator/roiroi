const { prfUpdateBodySchema } = require('./src/utils/validation');

async function main() {
  const payload = {
    id: 1,
    prfNo: null,
    dateRequested: '2026-05-18',
    dateNeeded: null,
    to: null,
    from: null,
    remarks: null,
    preparedBy: 'Test Admin',
    verifiedBy: 'Test Admin',
    notedBy: null,
    approvedBy: null,
    status: 'Pending Approval',
    requestor: 'Test Admin',
    department: null,
    company: null,
    archivedBy: null,
    disapprovalReason: null,
    items: []
  };

  try {
    console.log('Parsing payload with Zod...');
    const validatedBody = prfUpdateBodySchema.parse(payload);
    console.log('Zod parsed body successfully:', validatedBody);
  } catch (error) {
    console.error('Error occurred during Zod parsing:', error);
  }
}

main();
