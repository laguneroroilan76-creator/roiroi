const vehicleService = require('../services/vehicle.service');
const activityService = require('../services/activity.service');
const { createNotification } = require('./notification.controller');

const createVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);

    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'VEHICLE', 
      vehicle.id, 
      `${req.user.name || 'Unknown User'} added a new vehicle: ${vehicle.name} (${vehicle.plateNumber})`
    );

    await createNotification({
      message: `${req.user.name || 'A user'} added a new vehicle: ${vehicle.name}`,
      type: 'INFO',
      targetRole: 'Admin',
      link: '/vehicles'
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleService.getVehicles();
    res.json(vehicles);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body.status);
    await activityService.logActivity(
      req.user.id, 
      'UPDATE', 
      'VEHICLE', 
      vehicle.id, 
      `${req.user.name || 'Unknown User'} updated vehicle status for ${vehicle.plateNumber} to ${vehicle.status}`
    );
    res.json(vehicle);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'VEHICLE', 
      req.params.id, 
      `${req.user.name || 'Unknown User'} deleted a vehicle`
    );
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = { createVehicle, getVehicles, updateVehicle, updateVehicleStatus, deleteVehicle };
