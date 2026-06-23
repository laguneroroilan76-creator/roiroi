const prisma = require('../config/database');

const parseIntegerIfDefined = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const createVehicle = async (data) => {
  const capacity = parseIntegerIfDefined(data.capacity);

  return await prisma.vehicle.create({
    data: {
      name: data.name,
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      transmission: data.transmission,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
      capacity,
      status: data.status || 'Active'
    }
  });
};

const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

const updateVehicle = async (id, data) => {
  const capacity = parseIntegerIfDefined(data.capacity);
  const updateData = {
    name: data.name,
    plateNumber: data.plateNumber,
    brand: data.brand,
    model: data.model,
    year: data.year,
    color: data.color,
    fuelType: data.fuelType,
    transmission: data.transmission,
    engineNumber: data.engineNumber,
    chassisNumber: data.chassisNumber,
    status: data.status
  };

  if (capacity !== undefined) {
    updateData.capacity = capacity;
  }

  return await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: updateData
  });
};

const deleteVehicle = async (id) => {
  return await prisma.vehicle.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createVehicle, getVehicles, updateVehicle, deleteVehicle };
