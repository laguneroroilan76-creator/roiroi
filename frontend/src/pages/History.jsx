import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { historyService } from '../services/history.service';

// Modular Components
import TicketTable from '../components/history/TicketTable';
import CalendarView from '../components/history/CalendarView';
import ActivityLog from '../components/history/ActivityLog';
import { PageSkeleton } from '../components/shared/Skeleton';

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
  const [rfps, setRfps] = useState([]);
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
  }, [location.key]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, prfsRes, rfpsRes] = await Promise.all([
        historyService.getTripTickets(),
        historyService.getPRFs(),
        historyService.getRFPs()
      ]);

      const parseRecord = (record) => {
        if (!record.layout) return record;
        try {
          const parsed = JSON.parse(record.layout);
          return { 
            ...parsed, 
            ...record,
            status: record.status || parsed.status,
            receivedBy: record.receivedBy || parsed.receivedBy,
            receivedDate: record.receivedDate || parsed.receivedDate
          };
        } catch (e) { return record; }
      };

      setTickets(ticketsRes.map(parseRecord).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setPrfs(prfsRes.map(parseRecord).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setRfps(rfpsRes.map(parseRecord).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

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
    else if (type === 'RFP' || type === 'RRF') path = '/rfp';
    navigate(path, { state: { initialData: record, isReviewMode: true } });
  };

  const handleViewLogReference = (log) => {
    let record;
    if (log.resource === 'TRIP_TICKET') record = tickets.find(t => t.id === log.resourceId);
    else if (log.resource === 'PRF') record = prfs.find(p => p.id === log.resourceId);
    else if (log.resource === 'RFP' || log.resource === 'RRF') record = rfps.find(r => r.id === log.resourceId);
    
    if (record) handleViewRecord(record, log.resource);
  };

  if (loading) return <PageSkeleton type="table" />;

  return (
    <div className="history-page" style={{ padding: '3rem' }}>
      <header className="page-header" style={{ marginBottom: '3rem', animation: 'slideDown 0.6s ease-out' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-1.5px' }}>Records & Activity</h1>

      </header>

      <div className="tabs-container" style={{ display: 'flex', gap: '1.2rem', marginBottom: '3rem' }}>
        <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => handleTabChange('tickets')}>
          Trip Tickets
        </button>
        <button className={`tab-btn ${activeTab === 'prfs' ? 'active' : ''}`} onClick={() => handleTabChange('prfs')}>
          Purchase Requisition (PRF)
        </button>
        <button className={`tab-btn ${activeTab === 'rfps' ? 'active' : ''}`} onClick={() => handleTabChange('rfps')}>
          Request For Payment (RFP)
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => handleTabChange('calendar')}>
          Dispatch Calendar
        </button>
        {user?.canApprove && (
          <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => handleTabChange('logs')}>
            System Activity
          </button>
        )}
      </div>

      <div className="content-container premium-card" style={{ padding: '2.5rem', background: 'var(--card-bg)' }}>
        {activeTab === 'tickets' && (
          <TicketTable 
            tickets={tickets
              .filter(t => user?.role === 'Admin' || user?.canApprove || t.authorId === user?.id)
              .map(t => ({ ...t, requestorName: t.requestorName || t.author?.name || 'Unknown' }))} 
            onView={(t) => handleViewRecord(t, 'TRIP_TICKET')} 
          />
        )}

        {activeTab === 'prfs' && (
          <TicketTable 
            tickets={prfs
              .filter(p => user?.role === 'Admin' || user?.canApprove || p.authorId === user?.id)
              .map(p => ({ ...p, requestorName: p.requestor || p.author?.name || (p.prfNo ? `PRF #${p.prfNo}` : 'Unnamed PRF') }))} 
            onView={(p) => handleViewRecord(p, 'PRF')} 
            typeLabel="Purchase Requisition (PRF)"
          />
        )}

        {activeTab === 'rfps' && (
          <TicketTable 
            tickets={rfps
              .filter(r => user?.role === 'Admin' || user?.canApprove || r.authorId === user?.id)
              .map(r => ({ ...r, requestorName: r.requestor || r.author?.name || (r.rrfNo ? `RFP #${r.rrfNo}` : 'Unnamed RFP') }))} 
            onView={(r) => handleViewRecord(r, 'RFP')} 
            typeLabel="Request For Payment (RFP)"
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView 
            tickets={tickets.filter(t => user?.role === 'Admin' || user?.canApprove || t.authorId === user?.id)} 
            onTicketClick={(t) => handleViewRecord(t, 'TRIP_TICKET')} 
          />
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
          background: var(--primary); color: var(--bg-gradient); border-color: var(--primary); 
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
          transform: translateY(-3px);
        }
        
        .premium-card { animation: pageEnter 0.5s ease-out; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
