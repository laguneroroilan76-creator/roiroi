const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const adminOrPresident = (req, res, next) => {
  if (req.user.role === 'Admin' || req.user.departmentRole === 'President') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Admin or President only.' });
};

router.use(authenticateToken);

router.post('/', adminOrPresident, vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.put('/:id', adminOrPresident, vehicleController.updateVehicle);
router.delete('/:id', adminOrPresident, vehicleController.deleteVehicle);

module.exports = router;
