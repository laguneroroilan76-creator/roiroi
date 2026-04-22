import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const [tripTickets, setTripTickets] = useState([]);
  const [prfs, setPrfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, prfsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/trip-tickets'),
          axios.get('http://localhost:5000/api/prfs')
        ]);
        setTripTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
        setPrfs(Array.isArray(prfsRes.data) ? prfsRes.data : []);
      } catch (err) {
        console.error('Error fetching records:', err);
        setTripTickets([]);
        setPrfs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calendar Helpers
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);

    // Add empty slots for previous month
    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }

    // Add days of current month
    for (let d = 1; d <= totalDays; d++) {
        days.push(new Date(year, month, d));
    }
    return days;
  };

  const formatDate = (date) => date.toISOString().split('T')[0];

  const getTicketsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return tripTickets.filter(ticket => {
        // Simple string check or date range check
        // Check if dateRequested matches or if it falls within departure/return range
        if (ticket.dateRequested === dateStr) return true;
        
        // Try parsing range
        try {
            const start = new Date(ticket.dateTimeDeparture);
            const end = new Date(ticket.dateTimeReturn);
            if (!isNaN(start) && !isNaN(end)) {
                return date >= start && date <= end;
            }
        } catch(e) {}
        
        return false;
    });
  };

  const handleViewTicket = (ticket) => {
    navigate('/trip-ticket', { state: { initialData: ticket, readOnly: true } });
  };

  const handleViewPRF = (prf) => {
    navigate('/prf', { state: { initialData: prf, readOnly: true } });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  if (loading) return <div className="history-view" style={{ padding: '3rem', color: 'white' }}>Loading Records...</div>;

  return (
    <div className="history-view" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>History & Records</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.4rem' }}>
          Monitor all trip tickets and purchase requests.
        </p>
      </header>

      <section className="calendar-section">
        <div className="section-header">
            <h2>📅 Trip Ticket Calendar</h2>
            <div className="month-controls">
                <button onClick={prevMonth}>‹</button>
                <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={nextMonth}>›</button>
            </div>
        </div>

        <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="day-header">{day}</div>
            ))}
            {getCalendarDays().map((date, idx) => {
                const tickets = getTicketsForDate(date);
                return (
                    <div key={idx} className={`day-cell ${!date ? 'empty' : ''} ${date && formatDate(date) === formatDate(new Date()) ? 'today' : ''}`}>
                        {date && <span className="day-num">{date.getDate()}</span>}
                        <div className="day-events">
                            {tickets.map(t => (
                                <div 
                                    key={t.id} 
                                    className={`event-tag ${t.status?.toLowerCase() || 'pending'}`}
                                    onClick={() => handleViewTicket(t)}
                                    title={`${t.requestorName} - ${t.status || 'Pending'}`}
                                >
                                    {t.requestorName}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </section>

      <section className="records-section">
        <h2>📄 PRF Records</h2>
        <div className="records-list">
            {prfs.map(prf => (
                <div key={prf.id} className="record-card glass" onClick={() => handleViewPRF(prf)}>
                    <div className="card-top">
                        <span className="record-id">#{prf.prfNo || prf.id}</span>
                        <span className={`status-badge ${prf.status?.toLowerCase() || 'pending'}`}>
                            {prf.status || 'Pending'}
                        </span>
                    </div>
                    <div className="card-body">
                        <p><strong>Prepared By:</strong> {prf.preparedBy}</p>
                        <p><strong>Date Needed:</strong> {prf.dateNeeded}</p>
                    </div>
                    <div className="card-footer">
                        <span>Created: {prf.createdAt ? new Date(prf.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <button className="view-btn">View Details</button>
                    </div>
                </div>
            ))}
            {prfs.length === 0 && <p className="empty-msg">No PRF records found.</p>}
        </div>
      </section>

      <style>{`
        .history-view { 
            color: white; font-family: 'Outfit', sans-serif;
        }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .month-controls { display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.2); padding: 8px 20px; border-radius: 30px; border: 1px solid var(--glass-border); }
        .month-controls button { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0 10px; }
        .month-controls span { font-weight: 600; min-width: 150px; text-align: center; }

        .calendar-grid { 
            display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; 
            background: var(--glass-border); border-radius: 16px; overflow: hidden; border: 1px solid var(--glass-border);
        }
        .day-header { background: rgba(15, 23, 42, 0.8); padding: 12px; text-align: center; font-weight: 600; color: var(--text-dim); font-size: 0.8rem; text-transform: uppercase; }
        .day-cell { background: rgba(255, 255, 255, 0.03); min-height: 120px; padding: 10px; position: relative; transition: background 0.2s; }
        .day-cell:not(.empty):hover { background: rgba(255, 255, 255, 0.06); }
        .day-cell.today { background: rgba(99, 102, 241, 0.1); }
        .day-num { font-size: 0.9rem; font-weight: 600; color: var(--text-dim); }
        .today .day-num { color: #818cf8; }

        .day-events { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
        .event-tag { 
            font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; cursor: pointer; 
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            border-left: 3px solid transparent; transition: all 0.2s;
        }
        .event-tag:hover { transform: translateX(3px); filter: brightness(1.2); }
        .event-tag.pending { background: rgba(234, 179, 8, 0.2); color: #facc15; border-left-color: #facc15; }
        .event-tag.approved { background: rgba(34, 197, 94, 0.2); color: #4ade80; border-left-color: #4ade80; }

        .records-section { margin-top: 4rem; }
        .records-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
        .record-card { padding: 1.5rem; border-radius: 16px; cursor: pointer; transition: all 0.3s; }
        .record-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.08); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .record-id { font-family: monospace; color: var(--text-dim); }
        .status-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; font-weight: 600; text-transform: uppercase; }
        .status-badge.pending { background: rgba(234, 179, 8, 0.2); color: #facc15; }
        .status-badge.approved { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .card-body p { margin-bottom: 5px; font-size: 0.9rem; }
        .card-footer { margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-dim); }
        .view-btn { background: var(--primary); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
        
        .empty-msg { color: var(--text-dim); text-align: center; grid-column: 1 / -1; padding: 3rem; }
      `}</style>
    </div>
  );
}
