const driverService = require('../services/driver.service');

const createDriver = async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
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
    const driver = await driverService.updateDriverStatus(req.params.id, req.body.status);
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    await driverService.deleteDriver(req.params.id);
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createDriver, getDrivers, updateDriverStatus, deleteDriver };
