const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadLogo } = require('../middleware/upload.middleware');

const adminOrPresident = (req, res, next) => {
  if (req.user.role === 'Admin' || req.user.departmentRole === 'President') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Admin or President only.' });
};

router.use(authenticateToken);

router.get('/', companyController.getAllCompanies);
router.post('/', adminOrPresident, uploadLogo.single('logo'), companyController.createCompany);
router.put('/:id', adminOrPresident, uploadLogo.single('logo'), companyController.updateCompany);
router.delete('/:id', adminOrPresident, companyController.deleteCompany);

module.exports = router;
