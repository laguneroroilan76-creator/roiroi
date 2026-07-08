const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const adminOrPresident = (req, res, next) => {
  if (req.user.role === 'Admin' || req.user.departmentRole === 'President') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Admin or President only.' });
};

router.use(authenticateToken);

router.get('/', departmentController.getAllDepartments);
router.post('/', adminOrPresident, departmentController.createDepartment);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', adminOrPresident, departmentController.updateDepartment);
router.delete('/:id', adminOrPresident, departmentController.deleteDepartment);

module.exports = router;
