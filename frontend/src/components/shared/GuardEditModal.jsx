import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function GuardEditModal({ isOpen, ticket, onClose, onSaved }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [guards, setGuards] = useState([]);
  const [formData, setFormData] = useState({
    kmOut: '',
    kmIn: '',
    guardOut: '',
    guardIn: '',
    dateTimeDeparture: '',
    dateTimeReturn: ''
  });

  useEffect(() => {
    if (!ticket) return;
    setFormData({
      kmOut: ticket.kmOut || '',
      kmIn: ticket.kmIn || '',
      guardOut: ticket.guardOut || '',
      guardIn: ticket.guardIn || '',
      dateTimeDeparture: ticket.dateTimeDeparture || '',
      dateTimeReturn: ticket.dateTimeReturn || ''
    });
    fetchGuards();
  }, [ticket]);

  const fetchGuards = async () => {
    try {
      const res = await api.get('/users/guards');
      setGuards(res.data);
    } catch (err) {
      console.error('Failed to fetch guards', err);
    }
  };

  if (!isOpen || !ticket) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await api.put(`/trip-tickets/${ticket.id}`, formData);

      showToast('Guard checkpoint details updated.', 'success');
      onSaved();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update checkpoint details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="guard-modal-overlay" onClick={onClose}>
      <div className="guard-modal-card" onClick={(event) => event.stopPropagation()}>
        <h2>Guard Checkpoint Update</h2>
        <p className="guard-modal-subtitle">Edit KM readings, actual travel times, and guard on duty.</p>

        <div className="guard-summary-grid">
          <div>
            <span>Driver</span>
            <strong>{ticket.driver || 'N/A'}</strong>
          </div>
          <div>
            <span>Vehicle</span>
            <strong>{ticket.vehicle || 'N/A'}</strong>
          </div>
          <div>
            <span>Purpose</span>
            <strong>{ticket.purpose || 'N/A'}</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>{ticket.destination || 'N/A'}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="guard-form-grid">
          <label>
            Actual Departure
            <input type="datetime-local" name="dateTimeDeparture" value={formData.dateTimeDeparture} onChange={handleChange} />
          </label>
          <label>
            Actual Return
            <input type="datetime-local" name="dateTimeReturn" value={formData.dateTimeReturn} onChange={handleChange} />
          </label>
          
          <label>
            KM Out
            <input type="number" name="kmOut" value={formData.kmOut} onChange={handleChange} placeholder="e.g. 10450" />
          </label>
          <label>
            KM In
            <input type="number" name="kmIn" value={formData.kmIn} onChange={handleChange} placeholder="e.g. 10520" />
          </label>
          
          <label>
            Guard on Duty (Out)
            <select name="guardOut" value={formData.guardOut} onChange={handleChange} style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}>
              <option value="">Select Guard...</option>
              {guards.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </label>
          <label>
            Guard on Duty (In)
            <select name="guardIn" value={formData.guardIn} onChange={handleChange} style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}>
              <option value="">Select Guard...</option>
              {guards.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </label>

          <div className="guard-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save Update'}</button>
          </div>
        </form>
      </div>

      <style>{`
        .guard-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1.25rem;
        }

        .guard-modal-card {
          width: 100%;
          max-width: 760px;
          border-radius: 24px;
          padding: 2.5rem;
          background: #0f172a;
          border: 1px solid var(--glass-border);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .guard-modal-card h2 {
          margin: 0;
          color: var(--text-main);
          font-size: 1.55rem;
        }

        .guard-modal-subtitle {
          margin: 0.35rem 0 1rem;
          color: var(--text-dim);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .guard-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
          margin-bottom: 1rem;
          padding: 1rem;
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          background: var(--primary-light);
        }

        .guard-summary-grid div {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .guard-summary-grid span {
          color: var(--text-dim);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
        }

        .guard-summary-grid strong {
          color: var(--text-main);
          font-size: 0.95rem;
        }

        .guard-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .guard-form-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          color: var(--text-main);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .guard-form-grid input,
        .guard-form-grid select {
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.8rem 0.9rem;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
          outline: none;
          font-family: inherit;
          width: 100%;
        }

        .guard-form-grid select option {
          background: #1e293b;
          color: #f8fafc;
        }

        .guard-form-grid input:focus,
        .guard-form-grid select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
          background: rgba(255, 255, 255, 0.1);
        }

        .guard-modal-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 0.65rem;
          margin-top: 0.25rem;
        }

        .btn-cancel,
        .btn-save {
          border: none;
          border-radius: 10px;
          padding: 0.7rem 1.05rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-cancel {
          background: var(--primary-light);
          color: var(--primary);
        }

        .btn-save {
          background: var(--primary);
          color: #fff;
        }

        @media (max-width: 720px) {
          .guard-form-grid,
          .guard-summary-grid {
            grid-template-columns: 1fr;
          }

          .guard-modal-actions {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
