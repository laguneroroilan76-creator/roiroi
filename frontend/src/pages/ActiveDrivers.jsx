import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './ActiveDrivers.css';

export default function ActiveDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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

  if (loading) return <div className="drivers-page">Loading Data...</div>;

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
                  <span className="status-pill active">
                    Driver
                  </span>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan="3" className="empty-row">
                  No records found in the drivers list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
