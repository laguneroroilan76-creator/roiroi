import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './ActiveDrivers.css';
import { PageSkeleton } from '../../components/shared/Skeleton';
import { Edit2, X } from 'lucide-react';

export default function ActiveDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [inactiveReason, setInactiveReason] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      showToast('Failed to load drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (driver) => {
    if (driver.status === 'Active') {
        setSelectedDriver(driver);
        setInactiveReason('');
        setModalOpen(true);
    } else {
        updateStatus(driver.id, 'Active', null);
    }
  };

  const updateStatus = async (id, status, reason) => {
    try {
        await api.put(`/drivers/${id}`, { status, inactiveReason: reason });
        showToast(`Driver marked as ${status}`, 'success');
        fetchDrivers();
        setModalOpen(false);
    } catch (err) {
        showToast('Failed to update driver status', 'error');
    }
  };

  const handleSubmitInactive = (e) => {
      e.preventDefault();
      if (!inactiveReason.trim()) {
          showToast('Please enter a reason', 'error');
          return;
      }
      updateStatus(selectedDriver.id, 'Inactive', inactiveReason);
  };

  if (loading) return <PageSkeleton type="table" />;

  return (
    <div className="drivers-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Active Drivers List</h1>
        </div>
      </div>

      <div className="table-container">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Status</th>
              <th>Reason</th>
              {user?.role === 'Admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id}>
                <td>
                  <div className="driver-info-cell">
                    <span className="d-name">{driver.name || 'Unknown'}</span>
                  </div>
                </td>
                <td>
                  <span className="d-email">{driver.email}</span>
                </td>
                <td>
                  <span className="status-pill info">
                    Driver
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${driver.status === 'Inactive' ? 'inactive' : 'active'}`}>
                    {driver.status || 'Active'}
                  </span>
                </td>
                <td>
                  {driver.status === 'Inactive' && driver.inactiveReason ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', display: 'block', maxWidth: '200px', lineHeight: '1.4' }}>
                          {driver.inactiveReason}
                      </span>
                  ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                  )}
                </td>
                {(user?.role === 'Admin' || user?.departmentRole === 'President') && (
                  <td>
                    <button 
                        type="button"
                        className={driver.status === 'Inactive' ? "btn-activate" : "btn-deactivate"}
                        onClick={() => handleToggleStatus(driver)}
                    >
                        {driver.status === 'Inactive' ? 'ACTIVATE' : 'DEACTIVATE'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-row">
                  No records found in the drivers list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: 'var(--card-shadow)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Set Driver Inactive</h3>
                    <X size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setModalOpen(false)} />
                </div>
                <form onSubmit={handleSubmitInactive}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Reason for Inactivity</label>
                        <textarea 
                            value={inactiveReason}
                            onChange={(e) => setInactiveReason(e.target.value)}
                            placeholder="e.g. On Leave, Resigned, Suspended"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '80px', resize: 'vertical' }}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer' }}>Set Inactive</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
