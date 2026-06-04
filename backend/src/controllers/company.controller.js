const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all active companies
exports.getAllCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: { status: 'Active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

// Create a new company with optional logo
exports.createCompany = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    let logoUrl = null;

    if (req.file) {
      logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    const company = await prisma.company.create({
      data: {
        name,
        logoUrl,
        status: status || 'Active',
      }
    });

    res.status(201).json(company);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Company name already exists' });
    }
    next(error);
  }
};

// Update existing company (and optional new logo)
exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    let data = { name, status };

    if (req.file) {
      data.logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(company);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Company name already exists' });
    }
    next(error);
  }
};

// Delete/Deactivate company
exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.company.update({
      where: { id: parseInt(id) },
      data: { status: 'Inactive' }
    });
    res.json({ message: 'Company deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
