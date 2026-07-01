const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
