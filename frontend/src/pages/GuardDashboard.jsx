import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GuardEditModal from '../components/GuardEditModal';
import { useToast } from '../context/ToastContext';

export default function GuardDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'Guard') {
      navigate('/dashboard');
      return;
    }

    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trip-tickets');
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast('Unable to load trip tickets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedTickets = useMemo(() => {
    return tickets
      .filter((ticket) => ticket.status === 'Approved')
      .sort((a, b) => {
      const aDate = new Date(a.createdAt || a.dateRequested || 0).getTime();
      const bDate = new Date(b.createdAt || b.dateRequested || 0).getTime();
      return bDate - aDate;
    });
  }, [tickets]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  return (
    <div className="guard-dashboard-page">
      <header className="guard-header">
        <h1>Guard Dashboard</h1>
        <p>Approved trip tickets are visible. You can update only KM readings and guard sign-off fields.</p>
      </header>

      <section className="guard-table-wrap glass">
        {loading ? (
          <div className="guard-empty">Loading trip tickets...</div>
        ) : sortedTickets.length === 0 ? (
          <div className="guard-empty">No trip tickets available.</div>
        ) : (
          <table className="guard-table">
            <thead>
              <tr>
                <th>Date Requested</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Destination</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{formatDate(ticket.dateRequested || ticket.createdAt)}</td>
                  <td>{ticket.driver || 'N/A'}</td>
                  <td>{ticket.vehicle || 'N/A'}</td>
                  <td>{ticket.destination || 'N/A'}</td>
                  <td>
                    <span className={`guard-status ${String(ticket.status || 'Pending').toLowerCase()}`}>
                      {ticket.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="guard-edit-btn" onClick={() => setSelectedTicket(ticket)}>
                      Edit KM & Signature
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <GuardEditModal
        isOpen={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSaved={fetchTickets}
      />

      <style>{`
        .guard-dashboard-page {
          padding: 2rem;
          color: var(--text-main);
        }

        .guard-header {
          margin-bottom: 1.35rem;
        }

        .guard-header h1 {
          margin: 0;
          font-size: 2rem;
          letter-spacing: -0.04em;
        }

        .guard-header p {
          margin-top: 0.45rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .guard-table-wrap {
          border: 1px solid var(--glass-border);
          border-radius: 18px;
          overflow: hidden;
          background: var(--card-bg);
        }

        .guard-table {
          width: 100%;
          border-collapse: collapse;
        }

        .guard-table th,
        .guard-table td {
          padding: 0.95rem;
          border-bottom: 1px solid var(--glass-border);
          font-size: 0.9rem;
        }

        .guard-table th {
          background: var(--primary-light);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.74rem;
          color: var(--primary);
          font-weight: 800;
        }

        .guard-status {
          display: inline-block;
          border-radius: 999px;
          padding: 0.25rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .guard-status.approved {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .guard-status.pending {
          background: rgba(245, 158, 11, 0.14);
          color: #d97706;
        }

        .guard-status.archived {
          background: rgba(100, 116, 139, 0.16);
          color: #64748b;
        }

        .guard-edit-btn {
          border: none;
          border-radius: 10px;
          padding: 0.55rem 0.8rem;
          background: var(--primary);
          color: white;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        .guard-empty {
          padding: 2.5rem 1rem;
          text-align: center;
          color: var(--text-dim);
          font-weight: 600;
        }

        @media (max-width: 920px) {
          .guard-dashboard-page {
            padding: 1rem;
          }

          .guard-table-wrap {
            overflow-x: auto;
          }

          .guard-table {
            min-width: 860px;
          }
        }
      `}</style>
    </div>
  );
}
