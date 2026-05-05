const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
