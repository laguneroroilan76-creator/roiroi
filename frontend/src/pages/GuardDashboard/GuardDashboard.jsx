import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function GuardDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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
      .filter((ticket) => ['Approved', 'Ongoing', 'DEPARTED', 'ARRIVED', 'Completed'].includes(ticket.status))
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
    return parsed.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="guard-dashboard-page">
      <header className="guard-header">
        <h1>Approved Trip Ticket Log</h1>
        <p>Log mileage and actual travel times for authorized trip tickets.</p>
      </header>

      <div className="guard-list">
        {loading ? (
          <div className="guard-empty">Loading trip tickets...</div>
        ) : sortedTickets.length === 0 ? (
          <div className="guard-empty">No approved trip tickets available right now.</div>
        ) : (
          sortedTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="guard-list-item glass"
              onClick={() => navigate('/trip-ticket', { state: { initialData: ticket, isReviewMode: true } })}
              style={{ cursor: 'pointer' }}
            >
              <div className="item-main">
                <span className="item-no">#{ticket.id.toString().padStart(4, '0')}</span>
                <div className="item-info">
                  <span className="item-driver">
                    {ticket.driver || 'No Driver'}
                    {ticket.dateTimeDeparture && !ticket.dateTimeReturn && (
                      <span className="ongoing-badge">ONGOING</span>
                    )}
                    {ticket.dateTimeDeparture && ticket.dateTimeReturn && (
                      <span className="completed-badge">COMPLETED</span>
                    )}
                    {!ticket.dateTimeDeparture && (
                      <span className="authorized-badge">AUTHORIZED</span>
                    )}
                  </span>
                  <span className="item-vehicle">{ticket.vehicle || 'No Vehicle'} • {ticket.destination || 'No Destination'}</span>
                </div>
              </div>
              <div className="item-meta">
                <span className="item-date">{formatDate(ticket.dateRequested || ticket.createdAt)}</span>
                <span className="item-arrow">›</span>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .guard-dashboard-page {
          padding: 1.5rem;
          color: var(--text-main);
          max-width: 1000px;
          margin: 0 auto;
        }

        .guard-header {
          margin-bottom: 2rem;
          text-align: left;
        }

        .guard-header h1 {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.04em;
        }

        .guard-header p {
          font-size: 1rem;
          color: var(--text-dim);
          margin-top: 0.3rem;
        }

        .guard-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .guard-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          transition: all 0.2s ease;
        }

        .guard-list-item:hover {
          transform: translateX(5px);
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .item-main {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .item-no {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--primary);
          font-family: 'JetBrains Mono', monospace;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .item-driver {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ongoing-badge {
          background: rgba(15, 23, 42, 0.15);
          color: #0f172a;
          font-size: 0.65rem;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .completed-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          font-size: 0.65rem;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .authorized-badge {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          font-size: 0.65rem;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .item-vehicle {
          font-size: 0.9rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .item-date {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-dim);
          background: rgba(0,0,0,0.05);
          padding: 0.3rem 0.7rem;
          border-radius: 8px;
        }

        .item-arrow {
          display: none;
        }

        .guard-list-item:hover .item-arrow {
          opacity: 1;
        }

        .guard-empty {
          padding: 5rem 2rem;
          text-align: center;
          font-size: 1.25rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .item-main {
            gap: 1rem;
          }
          .item-meta {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
