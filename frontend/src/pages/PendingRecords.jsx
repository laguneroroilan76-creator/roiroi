import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import PremiumTable from '../components/shared/PremiumTable';

export default function PendingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets').catch(e => ({ data: [] })),
        api.get('/prfs').catch(e => ({ data: [] })),
        api.get('/rrfs').catch(e => ({ data: [] }))
      ]);

      const allPending = [
        ...ticketsRes.data.filter(t => t.status === 'Pending' || !t.status).map(t => ({ 
            ...t, 
            docType: 'TRIP_TICKET',
            displayType: 'Trip Ticket',
            requestorName: t.requestorName || t.author?.name || 'Unnamed Request'
        })),
        ...prfsRes.data.filter(p => p.status === 'Pending' || !p.status).map(p => ({ 
            ...p, 
            docType: 'PRF',
            displayType: 'PRF Form',
            requestorName: p.requestor || p.author?.name || (p.prfNo ? `PRF #${p.prfNo}` : 'Unnamed PRF')
        })),
        ...rrfsRes.data.filter(r => r.status === 'Pending' || !r.status).map(r => ({ 
            ...r, 
            docType: 'RRF',
            displayType: 'RRF Form',
            requestorName: r.requestor || r.author?.name || (r.rrfNo ? `RRF #${r.rrfNo}` : 'Unnamed RRF')
        }))
      ];

      setRecords(allPending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showToast('Error fetching pending records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (record) => {
    const path = record.docType === 'TRIP_TICKET' ? '/trip-ticket' : (record.docType === 'PRF' ? '/prf' : '/rrf');
    navigate(path, { state: { initialData: record, isReviewMode: true } });
  };

  return (
    <div className="pending-records-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px' }}>
            ⏳ Pending Approvals
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Review and take action on documents awaiting your approval.
        </p>
      </header>

      {loading ? (
        <div style={{ color: 'var(--text-dim)' }}>Loading pending documents...</div>
      ) : records.length > 0 ? (
        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {records.map(record => (
            <div key={`${record.docType}-${record.id}`} className="pending-card glass" style={{ 
                padding: '2rem', 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)',
                background: 'var(--card-bg)',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <span className={`type-badge ${record.docType}`} style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '800', 
                        padding: '6px 12px', 
                        borderRadius: '8px',
                        color: 'white',
                        textTransform: 'uppercase'
                    }}>
                        {record.displayType}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--text-main)' }}>
                    {record.requestorName}
                </h3>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                    Submitted by: <strong>{record.author?.name || 'User'}</strong>
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="action-btn primary" 
                        onClick={() => handleAction(record)}
                        style={{ 
                            flex: 1, 
                            padding: '12px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: 'var(--primary)', 
                            color: 'white', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            transition: '0.3s'
                        }}
                    >
                        Review & Approve
                    </button>
                </div>

                <style>{`
                    .pending-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); border-color: var(--primary); }
                    .action-btn:hover { opacity: 0.9; transform: scale(1.02); }
                `}</style>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass" style={{ padding: '4rem', borderRadius: '30px', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: 'var(--text-main)' }}>All caught up!</h2>
            <p style={{ color: 'var(--text-dim)' }}>No documents are currently pending approval.</p>
        </div>
      )}
    </div>
  );
}
