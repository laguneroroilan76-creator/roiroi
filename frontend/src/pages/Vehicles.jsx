import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './Vehicles.css';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    fuelType: '',
    transmission: '',
    engineNumber: '',
    chassisNumber: '',
    status: 'Active'
  });
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      showToast('Failed to load vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name || '',
        plateNumber: vehicle.plateNumber || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || '',
        transmission: vehicle.transmission || '',
        engineNumber: vehicle.engineNumber || '',
        chassisNumber: vehicle.chassisNumber || '',
        status: vehicle.status || 'Active'
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        name: '',
        plateNumber: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        fuelType: '',
        transmission: '',
        engineNumber: '',
        chassisNumber: '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData);
        showToast('Vehicle updated successfully', 'success');
      } else {
        await api.post('/vehicles', formData);
        showToast('Vehicle added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      showToast('Error saving vehicle', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      showToast('Vehicle deleted successfully', 'success');
      fetchVehicles();
    } catch (err) {
      showToast('Error deleting vehicle', 'error');
    }
  };

  if (loading) return <div className="vehicles-page">Loading Data...</div>;

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Vehicle Management</h1>
        </div>
        {(user?.role === 'Admin' || user?.permissions?.vehicles?.manage) && (
          <button className="btn add-btn" onClick={() => handleOpenModal()}>
            <span>+</span> Register New Vehicle
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Vehicle Description</th>
              <th>Plate Number</th>
              <th>Specifications</th>
              <th>Status</th>
              {(user?.role === 'Admin' || user?.permissions?.vehicles?.manage) && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>
                  <div className="vehicle-info-cell">
                    <span className="v-name">{vehicle.name}</span>
                    <span className="v-brand">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
                  </div>
                </td>
                <td>
                  <span className="plate-badge">{vehicle.plateNumber}</span>
                </td>
                <td>
                  <div className="spec-info">
                    <span>{vehicle.color || 'N/A'}</span>
                    <small>{vehicle.fuelType} | {vehicle.transmission}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${vehicle.status.toLowerCase()}`}>
                    {vehicle.status}
                  </span>
                </td>
                {(user?.role === 'Admin' || user?.permissions?.vehicles?.manage) && (
                  <td>
                    <div className="actions-cell">
                      <button className="action-link edit" onClick={() => handleOpenModal(vehicle)}>Edit</button>
                      <button className="action-link delete" onClick={() => handleDelete(vehicle.id)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={(user?.role === 'Admin' || user?.permissions?.vehicles?.manage) ? "5" : "4"} className="empty-row">
                  No records found in the vehicle registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="premium-modal">
            <div className="modal-header">
              <h2>{editingVehicle ? 'Update Vehicle Registry' : 'Register New Fleet Asset'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="vehicle-form">
              <div className="form-grid">
                {/* Basic Info */}
                <div className="form-section">
                  <h3 className="section-title">Identity</h3>
                  <div className="input-group">
                    <label>Common Name / Label</label>
                    <input
                      type="text"
                      value={formData.name}
                      placeholder="e.g. Service Car 1"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Plate Number</label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      placeholder="e.g. ABC 1234"
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="form-section">
                  <h3 className="section-title">Specifications</h3>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Brand</label>
                      <input type="text" value={formData.brand} placeholder="Toyota" onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Model</label>
                      <input type="text" value={formData.model} placeholder="Hilux" onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Year</label>
                      <input type="text" value={formData.year} placeholder="2023" onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Color</label>
                      <input type="text" value={formData.color} placeholder="Metallic Silver" onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="form-section">
                  <h3 className="section-title">Performance & Parts</h3>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Fuel Type</label>
                      <select value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}>
                        <option value="">Select Fuel</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Transmission</label>
                      <select value={formData.transmission} onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}>
                        <option value="">Select Trans.</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Engine Number</label>
                      <input type="text" value={formData.engineNumber} placeholder="ENG-XXXXXX" onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Chassis Number</label>
                      <input type="text" value={formData.chassisNumber} placeholder="CHS-XXXXXX" onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Availability</h3>
                  <div className="input-group">
                    <label>Operational Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Active">Active / Available</option>
                      <option value="Inactive">Under Maintenance / Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsModalOpen(false)}>Discard Changes</button>
                <button type="submit" className="btn submit">{editingVehicle ? 'Update Asset' : 'Register Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
