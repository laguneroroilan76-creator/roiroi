import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { historyService } from '../services/history.service';

// Modular Components
import TicketTable from '../components/history/TicketTable';
import CalendarView from '../components/history/CalendarView';
import ActivityLog from '../components/history/ActivityLog';

export default function History() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const passedTab = location.state?.initialTab;
    if (passedTab === 'activity') return 'logs';
    if (passedTab) return passedTab;
    return localStorage.getItem('historyActiveTab') || 'tickets';
  });
  
  const [tickets, setTickets] = useState([]);
  const [prfs, setPrfs] = useState([]);
  const [rrfs, setRrfs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('historyActiveTab', tab);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, prfsData, rrfsData] = await Promise.all([
        historyService.getTripTickets(),
        historyService.getPRFs(),
        historyService.getRRFs()
      ]);
      setTickets(ticketsData);
      setPrfs(prfsData);
      setRrfs(rrfsData);

      if (user?.canApprove) {
        const logsData = await historyService.getActivityLogs();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to load history data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record, type) => {
    let path = '/trip-ticket';
    if (type === 'PRF') path = '/prf';
    else if (type === 'RRF') path = '/rrf';
    navigate(path, { state: { initialData: record, isReviewMode: true } });
  };

  const handleViewLogReference = (log) => {
    let record;
    if (log.resource === 'TRIP_TICKET') record = tickets.find(t => t.id === log.resourceId);
    else if (log.resource === 'PRF') record = prfs.find(p => p.id === log.resourceId);
    else if (log.resource === 'RRF') record = rrfs.find(r => r.id === log.resourceId);
    
    if (record) handleViewRecord(record, log.resource);
  };

  if (loading) return <div className="history-page" style={{ padding: '3rem', color: 'var(--text-main)' }}>Loading System Records...</div>;

  return (
    <div className="history-page" style={{ padding: '3rem' }}>
      <header className="page-header" style={{ marginBottom: '3rem', animation: 'slideDown 0.6s ease-out' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-1.5px' }}>📂 Records & Activity</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.6rem', fontSize: '1.1rem', fontWeight: '500' }}>
          Monitor all document flows, approvals, and system changes in one centralized view.
        </p>
      </header>

      <div className="tabs-container" style={{ display: 'flex', gap: '1.2rem', marginBottom: '3rem' }}>
        <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => handleTabChange('tickets')}>
          🚗 Trip Tickets
        </button>
        <button className={`tab-btn ${activeTab === 'prfs' ? 'active' : ''}`} onClick={() => handleTabChange('prfs')}>
          📄 RFP Documents
        </button>
        <button className={`tab-btn ${activeTab === 'rrfs' ? 'active' : ''}`} onClick={() => handleTabChange('rrfs')}>
          📄 Purchase Requisition (PRF)
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => handleTabChange('calendar')}>
          📅 Dispatch Calendar
        </button>
        {user?.canApprove && (
          <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => handleTabChange('logs')}>
            📜 System Activity
          </button>
        )}
      </div>

      <div className="content-container premium-card" style={{ padding: '2.5rem', background: 'var(--card-bg)' }}>
        {activeTab === 'tickets' && (
          <TicketTable 
            tickets={tickets.map(t => ({ ...t, requestorName: t.requestorName || t.author?.name || 'Unknown' }))} 
            onView={(t) => handleViewRecord(t, 'TRIP_TICKET')} 
          />
        )}

        {activeTab === 'prfs' && (
          <TicketTable 
            tickets={prfs.map(p => ({ ...p, requestorName: p.requestor || p.author?.name || (p.prfNo ? `PRF #${p.prfNo}` : 'Unnamed PRF') }))} 
            onView={(p) => handleViewRecord(p, 'PRF')} 
            typeLabel="Request For Payment (RFP)"
          />
        )}

        {activeTab === 'rrfs' && (
          <TicketTable 
            tickets={rrfs.map(r => ({ ...r, requestorName: r.requestor || r.author?.name || (r.rrfNo ? `RRF #${r.rrfNo}` : 'Unnamed RRF') }))} 
            onView={(r) => handleViewRecord(r, 'RRF')} 
            typeLabel="Purchase Requisition (PRF)"
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView tickets={tickets} onTicketClick={(t) => handleViewRecord(t, 'TRIP_TICKET')} />
        )}

        {activeTab === 'logs' && (
          <ActivityLog logs={logs} onViewResource={handleViewLogReference} />
        )}
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        
        .tab-btn {
          padding: 14px 28px; border-radius: 16px; border: 1px solid var(--glass-border);
          background: var(--card-bg); color: var(--text-dim); cursor: pointer;
          font-weight: 700; transition: var(--transition-smooth); font-size: 0.95rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .tab-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); color: var(--primary); }
        .tab-btn.active { 
          background: var(--primary); color: white; border-color: var(--primary); 
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
          transform: translateY(-3px);
        }
        
        .premium-card { animation: pageEnter 0.5s ease-out; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
