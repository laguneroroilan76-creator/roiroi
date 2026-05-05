import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function PendingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets').catch(e => ({ data: [] })),
        api.get('/prfs').catch(e => ({ data: [] })),
        api.get('/rfps').catch(e => ({ data: [] }))
      ]);

      const parseRecord = (record) => {
        if (!record.layout) return record;
        try {
          const parsed = JSON.parse(record.layout);
          return { 
            ...parsed,
            ...record,
            status: record.status || parsed.status || 'Pending',
            approvedBy: record.approvedBy || parsed.approvedBy,
            verifiedBy: record.verifiedBy || parsed.verifiedBy,
            preparedBy: record.preparedBy || parsed.preparedBy
          };
        } catch (e) { return record; }
      };

      const allPending = [
        ...ticketsRes.data.filter(t => t.status === 'Pending' || t.status === 'Pending Endorsement' || t.status === 'Pending Approval' || !t.status).map(t => ({ 
            ...parseRecord(t), 
            docType: 'TRIP_TICKET',
            displayType: 'TT',
            apiEndpoint: '/trip-tickets',
            requestorName: t.requestorName || t.author?.name || 'Unnamed Request'
        })),
        ...prfsRes.data.filter(p => p.status === 'Pending' || !p.status).map(p => ({
            ...parseRecord(p),
            docType: 'PRF',
            displayType: 'PRF',
            apiEndpoint: '/prfs',
            requestorName: p.requestor || p.author?.name || `PRF #${p.prfNo || p.id}`
        })),
        ...rrfsRes.data.filter(r => r.status === 'Pending' || !r.status).map(r => ({
            ...parseRecord(r),
            docType: 'RFP',
            displayType: 'RFP',
            apiEndpoint: '/rfps',
            requestorName: r.requestor || r.author?.name || `RFP #${r.rrfNo || r.id}`
        }))
      ];

      const filteredPending = allPending.filter(record => {
        const isAdmin = user?.role === 'Admin' || user?.canApprove;
        
        // Granular filtering for Trip Ticket stages
        if (record.docType === 'TRIP_TICKET') {
            if (record.status === 'Pending Endorsement') return isAdmin || user?.canEndorse;
            if (record.status === 'Pending Approval') return isAdmin || user?.canApproveTripTicket;
        }

        if (user?.role === 'Accounting' && !isAdmin) {
            return record.userId === user.id || record.authorId === user.id;
        }
        return true;
      });

      setRecords(filteredPending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      showToast('Error fetching pending records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (record) => {
    if (record.docType === 'TRIP_TICKET') {
        navigate('/trip-ticket', { state: { initialData: record, isReview: true, readOnly: true } });
    } else if (record.docType === 'PRF') {
        navigate('/prf', { state: { initialData: record, isReview: true, readOnly: true } });
    } else if (record.docType === 'RRF' || record.docType === 'RFP') {
        navigate('/rfp', { state: { initialData: record, isReview: true, readOnly: true } });
    }
  };

  return (
    <div className="pending-records-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px' }}>
             Pending Approvals
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: '500' }}>
            Review and take action on documents awaiting your approval.
        </p>
      </header>

      {loading ? (
        <div style={{ color: 'var(--text-dim)' }}>Loading pending documents...</div>
      ) : records.length > 0 ? (
        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {records.map(record => (
            <div key={`${record.docType}-${record.id}`} className="pending-card glass" onClick={() => handleReview(record)} style={{ 
                padding: 0, 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)',
                background: 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '2rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <span className={`type-badge ${record.docType}`} style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '900', 
                            padding: '6px 14px', 
                            borderRadius: '100px',
                            color: record.docType === 'TRIP_TICKET' ? '#818cf8' : (record.docType === 'PRF' ? '#10b981' : '#f59e0b'),
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: record.docType === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.1)' : (record.docType === 'PRF' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                            border: `1px solid ${record.docType === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.2)' : (record.docType === 'PRF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`
                        }}>
                            {record.displayType}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                            {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '800' }}>
                        {record.requestorName}
                    </h3>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                        Submitted by: <strong style={{ color: 'var(--text-main)' }}>{record.author?.name || 'User'}</strong>
                    </p>
                </div>

                <div style={{ 
                    padding: '1.2rem 2rem', 
                    background: 'rgba(37, 99, 235, 0.05)', 
                    borderTop: '1px solid var(--glass-border)',
                    marginTop: 'auto'
                }}>
                    <button 
                        className="review-btn" 
                        onClick={(e) => { e.stopPropagation(); handleReview(record); }}
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: 'var(--primary)', 
                            color: 'white', 
                            fontWeight: '800', 
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            transition: '0.3s'
                        }}
                    >
                        {user?.role === 'Admin' || user?.canApprove ? 'REVIEW & APPROVAL' : 'REVIEW DOCUMENT'}
                    </button>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass" style={{ padding: '6rem 3rem', borderRadius: '30px', textAlign: 'center', border: '1px dashed var(--glass-border)', background: 'var(--card-bg)' }}>
            <h2 style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: '800' }}>All caught up!</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '1rem' }}>No documents are currently pending approval.</p>
        </div>
      )}

      <style>{`
        .pending-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary) !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;
        }
        .review-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4) !important;
            filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

