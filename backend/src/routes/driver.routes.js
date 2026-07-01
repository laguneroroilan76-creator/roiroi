const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', driverController.createDriver);
router.get('/', driverController.getDrivers);
router.put('/:id', driverController.updateDriverStatus);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
