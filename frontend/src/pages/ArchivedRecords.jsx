import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function ArchivedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast, confirm } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/trip-tickets', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/prfs', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/rrfs', { headers }).catch(() => ({ data: [] }))
      ]);

      const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      const prfs = Array.isArray(prfsRes.data) ? prfsRes.data : [];
      const rrfs = Array.isArray(rrfsRes.data) ? rrfsRes.data : [];

      const allArchived = [
        ...tickets.filter(t => t.status === 'Archived' || t.status === 'Disapproved').map(t => ({ ...t, type: 'TRIP_TICKET' })),
        ...prfs.filter(p => p.status === 'Archived' || p.status === 'Disapproved').map(p => ({ ...p, type: 'PRF' })),
        ...rrfs.filter(r => r.status === 'Archived' || r.status === 'Disapproved').map(r => ({ ...r, type: 'RRF' }))
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
    else if (record.type === 'RRF') path = '/rrf';
    navigate(path, { state: { initialData: record, readOnly: true } });
  };

  const handleRestore = async (e, record) => {
    e.stopPropagation();
    const confirmed = await confirm('Are you sure you want to restore this document to Approved status?');
    if (!confirmed) return;
    
    try {
      let endpoint = '';
      if (record.type === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (record.type === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (record.type === 'RRF') endpoint = `/rrfs/${record.id}`;

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
      else if (record.type === 'RRF') endpoint = `/rrfs/${record.id}`;

      await api.delete(endpoint);
      showToast('Document deleted permanently', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete document', 'error');
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'Archived') return 'ARCHIVED';
    if (status === 'Disapproved') return 'DISAPPROVED';
    return (status || 'Archived').toUpperCase();
  };

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-main)' }}>Loading Archived Records...</div>;

  return (
    <div className="archived-records-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>🗄️ Archived Records</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem' }}>View past documents that have been filed away for safekeeping.</p>
      </header>

      <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {records.map(record => (
          <div key={`${record.type}-${record.id}`} className="record-card glass" onClick={() => handleView(record)} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ 
                        padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                        background: record.type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.1)' : (record.type === 'PRF' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                        color: record.type === 'TRIP_TICKET' ? '#818cf8' : (record.type === 'PRF' ? '#10b981' : '#f59e0b'),
                        border: `1px solid ${record.type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.2)' : (record.type === 'PRF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`
                    }}>
                        {record.type === 'TRIP_TICKET' ? '🎫 TRIP TICKET' : (record.type === 'PRF' ? '💳 PRF' : '📄 RRF')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {new Date(record.createdAt).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                      {(record.status === 'Archived' || record.status === 'Disapproved') && (
                        <span style={{ color: record.status === 'Archived' ? '#64748b' : '#ef4444', fontWeight: 800, fontSize: '0.65rem', textAlign: 'right' }}>
                          {record.status === 'Archived' ? '🗄️ ARCHIVED' : '❌ DISAPPROVED'}
                          {record.archivedBy && <div style={{ fontSize: '0.6rem', opacity: 0.8, marginTop: '2px', fontWeight: 600 }}>by {record.archivedBy}</div>}
                          {record.disapprovalReason && (
                            <div style={{ 
                                color: '#ef4444', 
                                fontSize: '0.65rem', 
                                marginTop: '4px', 
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                textAlign: 'left'
                            }}>
                                💡 Reason: {record.disapprovalReason}
                            </div>
                          )}
                        </span>
                        )}
                    </span>
                </div>

                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
                    {record.type === 'TRIP_TICKET' 
                        ? (record.requestorName || record.author?.name || 'Unnamed Request') 
                        : (record.type === 'PRF' 
                            ? (record.requestor || record.author?.name || (record.prfNo ? `PRF #${record.prfNo}` : 'Unnamed PRF'))
                            : (record.requestor || record.author?.name || (record.rrfNo ? `RRF #${record.rrfNo}` : 'Unnamed RRF'))
                          )}
                </h3>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    {record.type === 'TRIP_TICKET' ? (
                        <p style={{ margin: 0 }}><strong>Driver:</strong> {record.driver || 'N/A'}</p>
                    ) : (
                        <p style={{ margin: 0 }}><strong>Purpose:</strong> {record.purpose || 'N/A'}</p>
                    )}
                </div>
            </div>
            
            <div style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--glass-border)', 
              background: record.status === 'Archived' ? 'rgba(100, 116, 139, 0.05)' : (record.status === 'Disapproved' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)'),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className="archive-action-btn delete-btn" 
                        onClick={(e) => handleDelete(e, record)}
                        title="Delete Permanently"
                    >
                        🗑️
                    </button>
                    <button 
                        className="archive-action-btn restore-btn" 
                        onClick={(e) => handleRestore(e, record)}
                        title="Restore to Approved"
                    >
                        🔄
                    </button>
                </div>
                <span style={{ color: record.status === 'Archived' ? '#64748b' : 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>
                    {getStatusLabel(record.status)} {record.archivedBy && `BY ${record.archivedBy.toUpperCase()}`} • View Full Document ›
                </span>
            </div>
          </div>
        ))}
        {records.length === 0 && (
            <div className="glass" style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', borderRadius: '24px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🗄️</div>
                <h2>No archived records found.</h2>
                <p style={{ color: 'var(--text-dim)' }}>Documents that are archived will be stored here safely.</p>
            </div>
        )}
      </div>

      <style>{`
        .record-card:hover { 
            transform: translateY(-8px); 
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        
        .archive-action-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: 0.3s;
            color: white; font-size: 0.9rem;
        }
        
        .archive-action-btn:hover {
            transform: scale(1.1);
        }
        
        .delete-btn:hover {
            background: #ef4444; border-color: #ef4444;
        }
        
        .restore-btn:hover {
            background: #10b981; border-color: #10b981;
        }
      `}</style>
    </div>
  );
}
