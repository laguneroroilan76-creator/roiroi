const prisma = require('../config/database');

const createRRF = async (userId, rrfData) => {
  const { items, layout, ...rest } = rrfData;
  
  // Explicitly map fields to avoid Prisma "unknown field" errors
  const data = {
    rrfNo: rest.rrfNo || rest.rfpNo || null,
    requestor: rest.requestor || null,
    dateRequested: rest.dateRequested || null,
    dateNeeded: rest.dateNeeded || null,
    to: rest.to || null,
    from: rest.from || null,
    department: rest.department || rest.chargeTo || null, // Map chargeTo to department for RFP
    company: rest.company || null,
    remarks: rest.remarks || rest.purpose || null, // Map purpose to remarks
    preparedBy: rest.preparedBy || null,
    verifiedBy: rest.verifiedBy || null,
    status: rest.status || 'Pending Dept Head Approval',
    authorId: userId ? parseInt(userId) : null,
    layout: layout || JSON.stringify(rrfData) // Store full payload in layout
  };

  if (items && Array.isArray(items) && items.length > 0) {
    data.items = {
      create: items.map(({ id, rrfId, prfId, ...it }) => it)
    };
  }

  return await prisma.rrf.create({
    data,
    include: { items: true }
  });
};

const getRRFs = async (userId, canApprove, role) => {
  let where = {};
  
  if (role === 'Accounting') {
    where = { status: { in: ['Approved', 'Completed'] } };
  } else if (role === 'Guard' || canApprove) {
    where = {};
  } else {
    where = { authorId: userId };
  }
  return await prisma.rrf.findMany({
    where,
    include: { items: true, author: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getRRFById = async (id) => {
  return await prisma.rrf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true }
  });
};

const updateRRF = async (id, data) => {
  const { items, layout, ...rest } = data;
  
  const updateData = {
    rrfNo: rest.rrfNo || rest.rfpNo || undefined,
    requestor: rest.requestor || undefined,
    dateRequested: rest.dateRequested || undefined,
    dateNeeded: rest.dateNeeded || undefined,
    to: rest.to || undefined,
    from: rest.from || undefined,
    department: rest.department || rest.chargeTo || undefined,
    company: rest.company || undefined,
    remarks: rest.remarks || rest.purpose || undefined,
    preparedBy: rest.preparedBy || undefined,
    verifiedBy: rest.verifiedBy || undefined,
    approvedBy: rest.approvedBy || undefined,
    receivedBy: rest.receivedBy !== undefined ? rest.receivedBy : undefined,
    receivedDate: rest.receivedDate !== undefined ? rest.receivedDate : undefined,
    status: rest.status || undefined,
    disapprovalReason: rest.disapprovalReason || undefined,
    layout: layout || JSON.stringify(data)
  };
  
  return await prisma.$transaction(async (tx) => {
    if (items && Array.isArray(items)) {
      await tx.rrfItem.deleteMany({ where: { rrfId: parseInt(id) } });
      updateData.items = {
        create: items.map(({ id: _id, rrfId: _rId, prfId: _pId, ...it }) => it)
      };
    }
    
    return await tx.rrf.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { items: true }
    });
  });
};

const deleteRRF = async (id) => {
  return await prisma.rrf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createRRF, getRRFs, getRRFById, updateRRF, deleteRRF };
