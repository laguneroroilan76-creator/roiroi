import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({ name: '', plateNumber: '', status: 'Active' });
  const { showToast } = useToast();

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
      setFormData({ name: vehicle.name, plateNumber: vehicle.plateNumber, status: vehicle.status });
    } else {
      setEditingVehicle(null);
      setFormData({ name: '', plateNumber: '', status: 'Active' });
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
        <h1>Vehicles List</h1>
        <button className="btn add-btn" onClick={() => handleOpenModal()}>
          <span>+</span> Add New Vehicle
        </button>
      </div>

      <div className="table-container glass">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Vehicle Model / Name</th>
              <th>Plate Number</th>
              <th>Status</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>
                    <div className="vehicle-cell">
                        <div className="vehicle-icon"></div>
                        <span style={{ fontWeight: 800 }}>{vehicle.name}</span>
                    </div>
                </td>
                <td>
                    <span className="plate-badge">{vehicle.plateNumber}</span>
                </td>
                <td>
                    <span className="status-badge" style={{ 
                        background: vehicle.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: vehicle.status === 'Active' ? '#10b981' : '#ef4444',
                        borderColor: vehicle.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}>
                        {vehicle.status}
                    </span>
                </td>
                <td className="date-cell">{new Date(vehicle.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    <button className="action-btn edit" onClick={() => handleOpenModal(vehicle)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(vehicle.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>No vehicles found. Add one above!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Car Model / Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  placeholder="e.g. Toyota Hilux"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Plate Number</label>
                <input 
                  type="text" 
                  value={formData.plateNumber} 
                  placeholder="e.g. ABC 1234"
                  onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              {editingVehicle && (
                <div className="input-group">
                  <label>Vehicle Status</label>
                  <select 
                      className="role-select"
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn submit">{editingVehicle ? 'Save Changes' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .vehicles-page { padding: 3rem; max-width: 1200px; margin: 0 auto; color: var(--text-main); }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
        
        .add-btn { width: auto; padding: 0.8rem 1.8rem; background: var(--primary); display: flex; align-items: center; gap: 10px; font-size: 0.95rem; margin-top: 0; border-radius: 16px; font-weight: 700; color: white; border: none; cursor: pointer;}
        .add-btn span { font-size: 1.4rem; line-height: 1; }

        .table-container { border-radius: 24px; overflow: hidden; border: 1px solid var(--glass-border); background: var(--card-bg); box-shadow: var(--card-shadow); }
        .vehicles-table { width: 100%; border-collapse: collapse; text-align: left; }
        .vehicles-table th { background: var(--primary-light); padding: 1.5rem; font-size: 0.85rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; border-bottom: 2px solid var(--glass-border); }
        .vehicles-table td { padding: 1.5rem; border-bottom: 1px solid var(--glass-border); vertical-align: middle; color: var(--text-main); font-weight: 500; }
        .vehicles-table tr:last-child td { border-bottom: none; }
        .vehicles-table tr:hover td { background: var(--primary-light); }
        
        .vehicle-cell { display: flex; align-items: center; gap: 15px; font-weight: 700; color: var(--text-main); }
        .vehicle-icon { 
            width: 40px; height: 40px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); 
            display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }

        .plate-badge {
            background: #e2e8f0; color: #1e293b; font-weight: 800; font-family: monospace;
            padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;
            letter-spacing: 1px;
        }

        .date-cell { color: var(--text-dim); font-size: 0.9rem; font-weight: 600; }

        .actions { display: flex; gap: 10px; justify-content: flex-end; }
        .action-btn { 
            width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--glass-border); 
            background: var(--card-bg); color: var(--text-main); cursor: pointer; transition: var(--transition-smooth);
            display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .action-btn:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .action-btn.edit:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

        .status-badge {
            font-size: 0.75rem; padding: 4px 12px; border-radius: 100px; font-weight: 800; 
            border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .modal-overlay { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: center; z-index: 1100;
        }
        .modal-content { width: 100%; max-width: 480px; padding: 3.5rem; border-radius: 32px; background: var(--card-bg); border: 1px solid var(--glass-border); box-shadow: var(--premium-shadow); animation: modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .modal-content h2 { margin-bottom: 2.5rem; text-align: center; color: var(--text-main); font-size: 2rem; font-weight: 800; letter-spacing: -0.5px; }
        .modal-actions { display: flex; gap: 15px; margin-top: 3rem; }
        .btn.cancel { background: var(--primary-light); color: var(--primary); flex: 1; margin-top: 0; border: 1px solid var(--glass-border); }
        .btn.cancel:hover { background: var(--primary); color: white; }
        .btn.submit { flex: 2; margin-top: 0; background: var(--primary); color: white; border: none; cursor: pointer; border-radius: 12px;}
        .btn.submit:hover { opacity: 0.9; }

        .role-select {
            width: 100%; padding: 1rem 1.5rem; background: var(--card-bg); 
            border: 1px solid var(--glass-border); border-radius: 16px; color: var(--text-main); 
            font-size: 1rem; outline: none; appearance: none; font-weight: 600;
            transition: var(--transition-smooth);
        }

        .input-group { margin-bottom: 1.5rem; }
        .input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; color: var(--text-dim); }
        .input-group input { width: 100%; padding: 1rem 1.5rem; border: 1px solid var(--glass-border); border-radius: 16px; background: var(--card-bg); color: var(--text-main); font-size: 1rem; outline: none; transition: 0.3s; }
        .input-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }

        .dark-mode .vehicles-table th { background: rgba(255,255,255,0.03); color: var(--text-dim); }
        .dark-mode .vehicles-table tr:hover td { background: rgba(255,255,255,0.03); }
        .dark-mode .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }
        .dark-mode .plate-badge { background: #1e293b; color: #f8fafc; border-color: #334155; }
      `}</style>
    </div>
  );
}
