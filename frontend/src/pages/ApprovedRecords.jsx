import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FileCheck, 
  Search, 
  Filter, 
  ArrowRight, 
  Inbox, 
  Archive, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Trash2,
  Ban,
  ShieldCheck,
  ClipboardCheck,
  History
} from 'lucide-react';

export default function ApprovedRecords() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentFilter = location.state?.filter;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(currentFilter || 'All');
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuard = user.role === 'Guard';
  const isAdmin = user.role === 'Admin' || 
                  user.canApprove || 
                  user.canApprovePRF || 
                  user.canApproveTripTicket || 
                  user.canApproveRFP || 
                  user.canEndorse || 
                  user.canVerify || 
                  user.canApproveDeptHead;
  const isDarkMode = document.body.classList.contains('dark-mode');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets').catch(() => ({ data: [] })),
        api.get('/prfs').catch(() => ({ data: [] })),
        api.get('/rfps').catch(() => ({ data: [] }))
      ]);

      const parseRecord = (record) => {
        if (!record.layout) return record;
        try {
          const parsed = JSON.parse(record.layout);
          return {
            ...parsed,
            ...record,
            status: record.status || parsed.status,
            requestorName: record.requestorName || record.requestor || record.author?.name || 'Unnamed'
          };
        } catch (e) { return record; }
      };

      const allApproved = [
        ...ticketsRes.data.filter(t => ['Approved', 'Completed', 'ARRIVED'].includes(t.status)).map(t => ({ 
            ...parseRecord(t), 
            docType: 'TRIP_TICKET',
            displayType: 'TT'
        })),
        ...(!isGuard ? prfsRes.data.filter(p => p.status === 'Approved' || p.status === 'Completed').map(p => ({ 
            ...parseRecord(p), 
            docType: 'PRF',
            displayType: 'PRF'
        })) : []),
        ...(!isGuard ? rrfsRes.data.filter(r => r.status === 'Approved' || r.status === 'Completed').map(r => ({ 
            ...parseRecord(r), 
            docType: 'RFP',
            displayType: 'RFP'
        })) : [])
      ];

      setRecords(allApproved.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
    } catch (err) {
      showToast('Failed to fetch records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (e, record) => {
    e.stopPropagation();
    if (isGuard) return;
    const confirmed = await confirm('Archive this document? It will be moved to the Archive Vault.');
    if (!confirmed) return;
    try {
      let endpoint = '';
      if (record.docType === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (record.docType === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (record.docType === 'RFP') endpoint = `/rfps/${record.id}`;

      await api.put(endpoint, { status: 'Archived' });
      showToast('Archived successfully!', 'success');
      fetchData();
    } catch (err) { showToast('Failed to archive', 'error'); }
  };

  const handleCancel = async (e, record) => {
    e.stopPropagation();
    const confirmed = await confirm('Cancel this approved trip?');
    if (!confirmed) return;
    try {
      await api.put(`/trip-tickets/${record.id}`, { status: 'Cancelled' });
      showToast('Trip Cancelled!', 'success');
      fetchData();
    } catch (err) { showToast('Failed to cancel trip', 'error'); }
  };

  const handleView = (record) => {
    const route = record.docType === 'TRIP_TICKET' ? '/trip-ticket' : (record.docType === 'PRF' ? '/prf' : '/rfp');
    navigate(route, { state: { initialData: record, readOnly: true, isInbox: location.state?.isInbox } });
  };

  const filteredRecords = records.filter(record => {
    if (location.state?.isInbox) {
      const isRFP = record.docType === 'RFP';
      const hasAccess = user.canApprove || record.authorId === user.id || user.role === 'Accounting';
      if (!(isRFP && hasAccess)) return false;
    }
    
    const matchesSearch = record.requestorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || record.docType === filterType;
    const isOwn = record.authorId === user.id;
    
    // Detailed permission check per document type
    const hasDocAccess = 
      user.role === 'Admin' || 
      user.canApprove || 
      (record.docType === 'TRIP_TICKET' && (user.canApproveTripTicket || user.canEndorse || user.canVerify || user.canApproveDeptHead)) ||
      (record.docType === 'PRF' && user.canApprovePRF) ||
      (record.docType === 'RFP' && (user.canApproveRFP || user.role === 'Accounting'));

    // Hide from Approved Records for Accounting if it's still pending for them
    if (!location.state?.isInbox && user.role === 'Accounting' && record.docType === 'RFP' && record.status === 'Approved' && !record.receivedBy) {
      return false;
    }

    return matchesSearch && matchesType && (hasDocAccess || isOwn || isGuard);
  });

  if (loading) return <div className="approved-records-page" style={{ padding: '3rem' }}>Loading authorized records...</div>;

  return (
    <div className={`approved-records-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="page-header" style={{ marginBottom: '3rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                {location.state?.isInbox ? 'RFP Inbox' : 'Approved Records'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="toolbar-glass">
        <div className="search-box-premium">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by requestor or author..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group-premium">
          <div className="filter-item-premium">
            <Filter size={16} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Document Types</option>
              <option value="TRIP_TICKET">Trip Ticket</option>
              <option value="PRF">Purchase Requisition (PRF)</option>
              <option value="RFP">Request For Payment (RFP)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container-glass">
        <table className="corporate-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th>Document Details</th>
              <th>Originator</th>
              <th>Live Status</th>
              <th>Final Approval</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record, index) => (
              <tr key={`${record.docType}-${record.id}`} onClick={() => handleView(record)} style={{ cursor: 'pointer' }}>
                <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {index + 1}
                </td>
                <td>
                  <div className="cell-document">
                    <div className="cell-icon-box" style={{ color: record.status === 'Completed' || record.status === 'ARRIVED' ? '#10b981' : 'var(--primary)' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="cell-text-main">{record.requestorName}</div>
                      <div className="cell-text-sub">
                        {record.displayType} #{record.id.toString().padStart(4, '0')}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {record.author?.avatarUrl ? (
                      <img 
                        src={record.author.avatarUrl.startsWith('http') ? record.author.avatarUrl : `${window.location.protocol}//${window.location.hostname}:5000${record.author.avatarUrl}`} 
                        alt="Avatar" 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        {record.author?.name?.[0] || 'U'}
                      </div>
                    )}
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{record.author?.name || 'User'}</span>
                  </div>
                </td>
                <td>
                  <span className="status-pill-premium" style={{ 
                    background: record.status === 'Completed' || record.status === 'ARRIVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: record.status === 'Completed' || record.status === 'ARRIVED' ? '#10b981' : '#1e293b',
                  }}>
                    {record.status === 'Completed' || record.status === 'ARRIVED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {record.status?.toUpperCase() || 'APPROVED'}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    {new Date(record.updatedAt || record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {isAdmin && (
                      <button className="action-btn-premium" onClick={(e) => handleArchive(e, record)} title="Archive Record">
                        <Archive size={16} />
                      </button>
                    )}
                    {record.docType === 'TRIP_TICKET' && isAdmin && record.status === 'Approved' && (
                      <button className="action-btn-premium" onClick={(e) => handleCancel(e, record)} title="Cancel Trip" style={{ color: '#ef4444' }}>
                        <Ban size={16} />
                      </button>
                    )}
                    <button className="action-btn-premium primary" onClick={(e) => { e.stopPropagation(); handleView(record); }} title="View Details">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '6rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'var(--text-dim)' }}>
                    <div style={{ padding: '2rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', opacity: 0.8 }}>
                      <Inbox size={64} strokeWidth={1} />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>No authorized records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
