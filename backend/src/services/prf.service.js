const prisma = require('../config/database');

const createPRF = async (userId, prfData) => {
  try {
    const { items, layout, ...rest } = prfData;
    
    // Map data carefully
    const data = {
      prfNo: rest.rrfNo || rest.rfpNo || rest.prfNo || null,
      dateRequested: rest.dateRequested || null,
      dateNeeded: rest.dateNeeded || null,
      to: rest.to || null,
      from: rest.from || null,
      department: rest.department || null,
      company: rest.company || null,
      remarks: rest.remarks || rest.purpose || null,
      preparedBy: rest.preparedBy || null,
      verifiedBy: rest.verifiedBy || null,
      notedBy: rest.notedBy || null,
      approvedBy: rest.approvedBy || null,
      status: rest.status || 'Pending',
      requestor: rest.requestor || null,
      authorId: userId ? parseInt(userId) : null,
      layout: layout || JSON.stringify(prfData)
    };

    // Only add items if it's an array and not empty
    if (items && Array.isArray(items) && items.length > 0) {
      data.items = {
        create: items.map(({ id, prfId, rrfId, ...it }) => it)
      };
    }

    return await prisma.prf.create({
      data,
      include: { items: true }
    });
  } catch (error) {
    console.error('Error in createPRF service:', error);
    throw error;
  }
};

const getPRFs = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.prf.findMany({
    where,
    include: { items: true, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPRFById = async (id) => {
  return await prisma.prf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true }
  });
};

const updatePRF = async (id, data) => {
  try {
    const { items, layout, ...rest } = data;
    
    const updateData = {
      prfNo: rest.rrfNo || rest.rfpNo || rest.prfNo || undefined,
      dateRequested: rest.dateRequested || undefined,
      dateNeeded: rest.dateNeeded || undefined,
      to: rest.to || undefined,
      from: rest.from || undefined,
      department: rest.department || undefined,
      company: rest.company || undefined,
      remarks: rest.remarks || rest.purpose || undefined,
      preparedBy: rest.preparedBy || undefined,
      verifiedBy: rest.verifiedBy || undefined,
      notedBy: rest.notedBy || undefined,
      approvedBy: rest.approvedBy || undefined,
      status: rest.status || undefined,
      requestor: rest.requestor || undefined,
      disapprovalReason: rest.disapprovalReason || undefined,
      archivedBy: rest.archivedBy || undefined,
      layout: layout || JSON.stringify(data)
    };

    return await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items)) {
        await tx.prfItem.deleteMany({ where: { prfId: parseInt(id) } });
        updateData.items = {
          create: items.map(({ id: _id, prfId: _pId, rrfId: _rId, ...it }) => it)
        };
      }
      
      return await tx.prf.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { items: true }
      });
    });
  } catch (error) {
    console.error('Error in updatePRF service:', error);
    throw error;
  }
};

const deletePRF = async (id) => {
  return await prisma.prf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createPRF, getPRFs, getPRFById, updatePRF, deletePRF };
