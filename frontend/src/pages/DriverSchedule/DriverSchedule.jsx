import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function DriverSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin' || user.canApprove;

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/trip-tickets/schedule/driver');
      setSchedules(response.data);
    } catch (error) {
      showToast('Failed to fetch schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (trip) => {
    navigate('/trip-ticket', { state: { initialData: trip, readOnly: true } });
  };

  return (
    <div className="driver-schedule-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          {isAdmin ? 'Master Driving Schedule' : 'My Driving Schedule'}
        </h1>
      </header>

      {loading ? (
        <div style={{ color: 'var(--text-dim)' }}>Loading schedule...</div>
      ) : (
        <div className="schedule-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {schedules.map(trip => (
            <div key={trip.id} className="schedule-card glass" onClick={() => handleView(trip)} style={{
              padding: '2rem',
              borderRadius: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '2rem',
              alignItems: 'stretch',
              border: '1px solid var(--glass-border)',
              background: 'var(--card-bg)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div className="trip-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Trip Ticket #{trip.id.toString().padStart(4, '0')}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{trip.destination}</h3>
                <p style={{ color: 'var(--text-dim)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                  Purpose: {trip.purpose}
                </p>
              </div>

              <div className="fleet-info" style={{ paddingLeft: '2rem', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: isAdmin ? '1rem' : 0 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vehicle</label>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{trip.vehicle}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{trip.plateNumber}</div>
                </div>
                {isAdmin && (
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assigned Driver</label>
                    <div style={{ fontWeight: 700 }}>{trip.driver}</div>
                  </div>
                )}
              </div>

              <div className="time-info" style={{ paddingLeft: '2rem', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Departure (ETD)</label>
                  <div style={{ fontWeight: 700 }}>
                    {trip.etdOffice ? new Date(trip.etdOffice).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                    }) : 'Not set'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: trip.dateTimeDeparture && !trip.dateTimeReturn ? '#0f172a' : (trip.dateTimeReturn ? '#10b981' : '#22c55e')
                    }}></span>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                      {trip.dateTimeDeparture && !trip.dateTimeReturn ? 'DEPARTED' : (trip.dateTimeReturn ? 'ARRIVED' : 'APPROVED')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div className="glass" style={{ padding: '5rem', textAlign: 'center', borderRadius: '24px' }}>
              <div></div>
              <h2>No scheduled trips found.</h2>
              <p style={{ color: 'var(--text-dim)' }}>New assignments will appear here once approved by an administrator.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
