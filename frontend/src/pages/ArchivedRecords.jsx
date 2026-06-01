import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Archive, 
  Trash2, 
  RefreshCcw, 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Inbox
} from 'lucide-react';

export default function ArchivedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || 'All');
  const navigate = useNavigate();
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin' || user.canApprove;
  const isDarkMode = document.body.classList.contains('dark-mode');

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets').catch(() => ({ data: [] })),
        api.get('/prfs').catch(() => ({ data: [] })),
        api.get('/rfps').catch(() => ({ data: [] }))
      ]);

      const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      const prfs = Array.isArray(prfsRes.data) ? prfsRes.data : [];
      const rrfs = Array.isArray(rrfsRes.data) ? rrfsRes.data : [];

      const allArchived = [
        ...tickets.filter(t => ['Archived', 'Disapproved', 'Cancelled'].includes(t.status)).map(t => ({ ...t, type: 'TRIP_TICKET', displayType: 'TT' })),
        ...prfs.filter(p => ['Archived', 'Disapproved', 'Cancelled'].includes(p.status)).map(p => ({ ...p, type: 'PRF', displayType: 'PRF' })),
        ...rrfs.filter(r => ['Archived', 'Disapproved', 'Cancelled'].includes(r.status)).map(r => ({ ...r, type: 'RFP', displayType: 'RFP' }))
      ];

      setRecords(allArchived.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleView = (record) => {
    let path = '/trip-ticket';
    if (record.type === 'PRF') path = '/prf';
    else if (record.type === 'RRF' || record.type === 'RFP') path = '/rfp';
    navigate(path, { state: { initialData: record, readOnly: true, isArchived: true } });
  };

  const handleRestore = async (e, record) => {
    e.stopPropagation();
    const confirmed = await confirm('Are you sure you want to restore this document to Approved status?');
    if (!confirmed) return;

    try {
      let endpoint = '';
      if (record.type === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (record.type === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (record.type === 'RFP') endpoint = `/rfps/${record.id}`;

      await api.put(endpoint, { status: 'Approved' });
      showToast('Document restored successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to restore document', 'error');
    }
  };

  const handleDelete = async (e, record) => {
    e.stopPropagation();
    const confirmed = await confirm('WARNING: This will permanently delete the document from the system. Are you sure?');
    if (!confirmed) return;

    try {
      let endpoint = '';
      if (record.type === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (record.type === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (record.type === 'RFP') endpoint = `/rfps/${record.id}`;

      await api.delete(endpoint);
      showToast('Document deleted permanently', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete document', 'error');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Archived') return { bg: 'rgba(100, 116, 139, 0.1)', text: '#475569' };
    if (status === 'Disapproved') return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
    if (status === 'Cancelled') return { bg: 'rgba(245, 158, 11, 0.1)', text: '#334155' };
    return { bg: 'rgba(100, 116, 139, 0.1)', text: '#475569' };
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.requestorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || record.type === filterType;
    
    let matchesStatus = true;
    if (statusFilter === 'Archived') matchesStatus = record.status === 'Archived';
    if (statusFilter === 'Rejected') matchesStatus = record.status === 'Disapproved' || record.status === 'Cancelled';

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return <div className="archived-records-page" style={{ padding: '3rem' }}>Loading archived registry...</div>;

  return (
    <div className={`archived-records-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="page-header" style={{ marginBottom: '3rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Archived Records</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="toolbar-glass">
        <div className="search-box-premium">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search archived documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group-premium">
          <div className="filter-item-premium">
            <Filter size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Archived">Archived Only</option>
              <option value="Rejected">Rejected & Cancelled</option>
            </select>
          </div>
          <div className="filter-item-premium">
            <Filter size={16} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
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
              <th>Status & Reason</th>
              <th>Archived Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record, index) => (
              <tr key={`${record.type}-${record.id}`} onClick={() => handleView(record)} style={{ cursor: 'pointer' }}>
                <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {index + 1}
                </td>
                <td>
                  <div className="cell-document">
                    <div className="cell-icon-box">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="cell-text-main">
                        {record.type === 'TRIP_TICKET' ? record.requestorName : record.requestor || record.purpose || 'Unnamed Document'}
                      </div>
                      <div className="cell-text-sub">
                        {record.displayType} #{record.id.toString().padStart(4, '0')}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="status-pill-premium" style={{ 
                      background: getStatusColor(record.status).bg, 
                      color: getStatusColor(record.status).text 
                    }}>
                      <Clock size={12} /> {record.status?.toUpperCase()}
                    </span>
                    {record.disapprovalReason && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, maxWidth: '200px' }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.disapprovalReason}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    {new Date(record.updatedAt || record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {isAdmin && (
                      <>
                        <button className="action-btn-premium" onClick={(e) => handleRestore(e, record)} title="Restore Document">
                          <RefreshCcw size={16} />
                        </button>
                        <button className="action-btn-premium" onClick={(e) => handleDelete(e, record)} title="Delete Permanently" style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <button className="action-btn-premium primary" onClick={(e) => { e.stopPropagation(); handleView(record); }} title="View Record">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '6rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'var(--text-dim)' }}>
                    <div style={{ padding: '2rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', opacity: 0.8 }}>
                      <Inbox size={64} strokeWidth={1} />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>No archived records found.</p>
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

