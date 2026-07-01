const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'Active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({ where: { id: parseInt(id) } });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, isAdmin } = req.body;
    const department = await prisma.department.create({
      data: {
        name,
        isAdmin: isAdmin ?? false
      }
    });
    res.status(201).json(department);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isAdmin, status } = req.body;
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name, isAdmin, status }
    });
    res.json(department);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.update({
      where: { id: parseInt(id) },
      data: { status: 'Inactive' }
    });
    res.json({ message: 'Department deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
