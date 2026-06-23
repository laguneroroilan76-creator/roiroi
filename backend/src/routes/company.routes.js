const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadLogo } = require('../middleware/upload.middleware');

router.use(authenticateToken);

router.get('/', companyController.getAllCompanies);
router.post('/', uploadLogo.single('logo'), companyController.createCompany);
router.put('/:id', uploadLogo.single('logo'), companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;
