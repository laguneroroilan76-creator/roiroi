const driverService = require('../services/driver.service');
const activityService = require('../services/activity.service');
const { createNotification } = require('./notification.controller');

const createDriver = async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'DRIVER', 
      driver.id, 
      `${req.user.name || 'Unknown User'} added a new driver: ${driver.name}`
    );

    await createNotification({
      message: `${req.user.name || 'A user'} added a new driver: ${driver.name}`,
      type: 'INFO',
      targetRole: 'Admin',
      link: '/active-drivers'
    });

    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDrivers = async (req, res) => {
  try {
    const drivers = await driverService.getDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const driver = await driverService.updateDriverStatus(req.params.id, {
        status: req.body.status,
        inactiveReason: req.body.inactiveReason
    });
    await activityService.logActivity(
      req.user.id, 
      'UPDATE', 
      'DRIVER', 
      driver.id, 
      `${req.user.name || 'Unknown User'} updated driver status for ${driver.name} to ${driver.status}`
    );
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    await driverService.deleteDriver(req.params.id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'DRIVER', 
      req.params.id, 
      `${req.user.name || 'Unknown User'} deleted a driver`
    );
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createDriver, getDrivers, updateDriverStatus, deleteDriver };
