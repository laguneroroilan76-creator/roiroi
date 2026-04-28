const vehicleService = require('../services/vehicle.service');

const createVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleService.getVehicles();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createVehicle, getVehicles, updateVehicleStatus, deleteVehicle };
