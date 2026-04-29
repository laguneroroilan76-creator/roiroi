import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function ApprovedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [guards, setGuards] = useState([]);
  const navigate = useNavigate();
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuard = user.role === 'Guard';
  const isAdmin = user.role === 'Admin' || user.canApprove;

  useEffect(() => {
    fetchData();
    fetchGuards();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets'),
        api.get('/prfs'),
        api.get('/rrfs')
      ]);

      const allApproved = [
        ...ticketsRes.data.filter(t => t.status === 'Approved').map(t => ({ ...t, type: 'TRIP_TICKET' })),
        ...(!isGuard ? prfsRes.data.filter(p => p.status === 'Approved').map(p => ({ ...p, type: 'PRF' })) : []),
        ...(!isGuard ? rrfsRes.data.filter(r => r.status === 'Approved').map(r => ({ ...r, type: 'RRF' })) : [])
      ];

      setRecords(allApproved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    try {
      const res = await api.get('/users/guards');
      setGuards(res.data);
    } catch (err) {
      console.error('Failed to fetch guards', err);
    }
  };

  const handleUpdateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id && r.type === 'TRIP_TICKET' ? updatedRecord : r));
    if (selectedRecord?.id === updatedRecord.id) {
        setSelectedRecord(updatedRecord);
    }
  };

  const handleArchive = async (record) => {
    if (isGuard) {
      showToast('You do not have permission to archive records.', 'error');
      return;
    }
    const confirmed = await confirm('Are you sure you want to archive this document?');
    if (!confirmed) return;
    try {
      let endpoint = '';
      const type = getRecordType(record);
      if (type === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (type === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (type === 'RRF') endpoint = `/rrfs/${record.id}`;

      await api.put(endpoint, { status: 'Archived' });
      showToast('Document Archived successfully!', 'success');
      setSelectedRecord(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to archive document', 'error');
    }
  };

  const handleCancel = async (record) => {
    const confirmed = await confirm('Are you sure you want to CANCEL this approved trip? This will release the driver and vehicle for other bookings.');
    if (!confirmed) return;
    try {
      await api.put(`/trip-tickets/${record.id}`, { status: 'Cancelled' });
      showToast('Trip Ticket Cancelled!', 'info');
      setSelectedRecord(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to cancel trip', 'error');
    }
  };

  const getRecordType = (record) => {
    return record.type || record.docType || record.formType || (
      record.prfNo ? 'PRF' : (record.rrfNo ? 'RRF' : 'TRIP_TICKET')
    );
  };

  const handleView = (record) => {
    setSelectedRecord({ ...record, type: getRecordType(record) });
  };

  const getStatusLabel = (status) => {
    if (!status) return 'APPROVED';
    if (status === 'Archived') return 'ARCHIVED';
    if (status === 'Disapproved') return 'DISAPPROVED';
    return status.toUpperCase();
  };

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-main)' }}>Loading Approved Records...</div>;

  return (
    <div className="approved-records-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          {isGuard ? '✅ Approved Trip Tickets' : '✅ Approved Records'}
        </h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem' }}>
          {isGuard 
            ? 'View and print all authorized trip tickets for vehicle dispatching.' 
            : 'View and print all authorized documents in one place.'}
        </p>
      </header>

      <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {records.map(record => {
          const type = getRecordType(record);
          return (
          <div key={`${type}-${record.id}`} className="record-card glass" onClick={() => handleView(record)} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ 
                            padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                            background: type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.1)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                            color: type === 'TRIP_TICKET' ? '#818cf8' : (type === 'PRF' ? '#10b981' : '#f59e0b'),
                            border: `1px solid ${type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.2)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`
                        }}>
                            {type === 'TRIP_TICKET' ? '🚗 TRIP TICKET' : (type === 'PRF' ? '📄 RFP' : '📄 PRF')}
                        </span>
                        {type === 'TRIP_TICKET' && record.dateTimeDeparture && !record.dateTimeReturn && (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#6366f1', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>ONGOING</span>
                        )}
                        {type === 'TRIP_TICKET' && record.dateTimeDeparture && record.dateTimeReturn && (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#10b981', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>COMPLETED</span>
                        )}
                        {type === 'TRIP_TICKET' && !record.dateTimeDeparture && (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '0.65rem', fontWeight: 900 }}>AUTHORIZED</span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(record.createdAt).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </span>
                </div>

                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
              {type === 'TRIP_TICKET' 
                        ? (record.requestorName || record.author?.name || 'Unnamed Request') 
                : (type === 'PRF' 
                            ? (record.requestor || record.author?.name || (record.prfNo ? `PRF #${record.prfNo}` : 'Unnamed PRF'))
                            : (record.requestor || record.author?.name || (record.rrfNo ? `RRF #${record.rrfNo}` : 'Unnamed RRF'))
                          )}
                </h3>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              {type === 'TRIP_TICKET' ? (
                        <p style={{ margin: 0 }}><strong>Driver:</strong> {record.driver || 'N/A'}</p>
                    ) : (
                        <p style={{ margin: 0 }}><strong>Purpose:</strong> {record.purpose || 'N/A'}</p>
                    )}
                </div>
            </div>
            
            <div style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--glass-border)', 
                background: (type === 'TRIP_TICKET' && record.dateTimeDeparture && !record.dateTimeReturn) 
                    ? 'rgba(99, 102, 241, 0.08)' 
                    : 'rgba(34, 197, 94, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px'
            }}>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {isAdmin && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleArchive(record); }}
                                style={{ 
                                    background: 'rgba(245, 158, 11, 0.1)', 
                                    border: '1px solid rgba(245, 158, 11, 0.2)', 
                                    borderRadius: '8px', 
                                    padding: '6px 12px', 
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📥 Archive
                            </button>
                            {type === 'TRIP_TICKET' && record.status === 'Approved' && !record.dateTimeDeparture && (isAdmin || record.userId === user.id || record.requestedBy === user.name) && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCancel(record); }}
                                    style={{ 
                                        background: 'rgba(249, 115, 22, 0.1)', 
                                        border: '1px solid rgba(249, 115, 22, 0.2)', 
                                        borderRadius: '8px', 
                                        padding: '6px 12px', 
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#f97316',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🚫 Cancel
                                </button>
                            )}
                        </>
                    )}
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        View Full Document ›
                    </span>
                </div>
            </div>
          </div>
        );})}
        {records.length === 0 && (
            <div className="glass" style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', borderRadius: '24px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🍃</div>
                <h2>No approved records found yet.</h2>
                <p style={{ color: 'var(--text-dim)' }}>Authorized documents will appear here once they are approved by an administrator.</p>
            </div>
        )}
      </div>

      {selectedRecord && (
        <div
          onClick={() => setSelectedRecord(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 3000
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '1120px',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '2rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            {selectedRecord.type === 'TRIP_TICKET' ? (
              <TripTicketPreview record={selectedRecord} onClose={() => setSelectedRecord(null)} guards={guards} onUpdate={handleUpdateRecord} onArchive={handleArchive} onCancel={handleCancel} />
            ) : (
              <GenericPreview record={selectedRecord} onClose={() => setSelectedRecord(null)} onArchive={handleArchive} />
            )}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; /* Hides browser headers/footers */
          }
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: 'Arial', sans-serif !important;
            color: #000 !important;
            font-size: 11px;
            margin: 0 !important;
            padding: 2.2cm 1.5cm 1.5cm !important; /* Increased top padding to 2.2cm */
          }
 
          header, footer, nav, aside, .no-print, button, .tool-btn, .ticket-preview-actions, .status-badge {
            display: none !important;
          }
 
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
 
          .approved-records-page { padding: 0 !important; margin: 0 !important; background: #fff !important; }
          .approved-records-page > header, .records-grid { display: none !important; }
 
          .approved-records-page > div[style*="position: fixed"] {
            position: absolute !important;
            top: 1cm !important; /* Move the container down by 1cm */
            top: 1cm !important; 
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #fff !important;
            padding: 0 !important;
            display: block !important;
          }
 
          .approved-records-page > div[style*="position: fixed"] > div {
            box-shadow: none !important;
            background: #fff !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
 
          .ticket-preview-shell, 
          .ticket-preview-shell * { 
            background-color: transparent !important;
            box-shadow: none !important;
          }
 
          .ticket-preview-shell { 
            margin-top: 0 !important; 
            break-inside: avoid;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.8rem !important; 
            width: 100% !important;
            transform: scale(0.91); 
            transform-origin: top center;
            box-shadow: none !important;
          }
 
          .ticket-preview-header {
            margin-bottom: 0.6rem !important;
            border-bottom: 2.5px solid #000 !important;
            padding-bottom: 0.4rem !important;
          }
          .ticket-preview-header h2 { font-size: 1.4rem !important; margin: 0; color: #000 !important; }
          .ticket-preview-header p { font-size: 0.85rem !important; margin: 0.1rem 0 0; color: #000 !important; text-transform: uppercase; letter-spacing: 2px; }
          
          .company-logo-preview {
            height: 45px !important;
          }

          .ticket-preview-section { margin-bottom: 0.4rem !important; }
          .ticket-preview-section h3 { 
            font-size: 0.85rem !important; 
            font-weight: 800 !important;
            margin-bottom: 0.4rem !important; 
            border-bottom: 2px solid #000 !important;
            padding-bottom: 2px !important;
            color: #000 !important;
            text-transform: uppercase;
          }
 
          .ticket-preview-section-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.7rem !important;
          }
          
          .ticket-preview-field label { font-size: 0.6rem !important; font-weight: 700 !important; margin-bottom: 2px !important; color: #000 !important; }
          .ticket-preview-value {
            min-height: 20px !important;
            padding: 1px 0 !important;
            border-bottom: 1.5px solid #000 !important;
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            color: #000 !important;
            background: transparent !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
 
          .ticket-preview-value::-webkit-calendar-picker-indicator,
          .ticket-preview-value::-webkit-inner-spin-button,
          .ticket-preview-value::-webkit-clear-button {
            display: none !important;
            -webkit-appearance: none !important;
          }
 
          .ticket-preview-card {
            border: 1.5px solid #000 !important;
            padding: 0.5rem !important;
            border-radius: 6px !important;
            background: transparent !important;
          }
          .ticket-preview-card h4 { font-size: 0.75rem !important; font-weight: 800 !important; margin-bottom: 0.2rem !important; text-decoration: underline; color: #000 !important; }
 
          .ticket-preview-signatures {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1.2rem !important;
            margin-top: 1.5rem !important;
            break-inside: avoid;
          }
          .signature-line { 
            border-bottom: 2px solid #000 !important; 
            min-height: 25px !important; 
            font-size: 0.95rem !important; 
            font-weight: 800 !important;
            margin-bottom: 0.4rem !important;
            color: #000 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-end !important;
          }
          .ticket-preview-signature span { font-size: 0.7rem !important; font-weight: 800 !important; color: #000 !important; text-transform: uppercase; }
        }

        .record-card:hover { 
            transform: translateY(-8px); 
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .ticket-preview-shell {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          color: var(--text-main);
        }

        .dark-mode .ticket-preview-value {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        
        .dark-mode .ticket-preview-card {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .dark-mode .ticket-preview-section h3 {
          color: #818cf8 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .dark-mode .ticket-preview-header {
          border-color: var(--primary) !important;
        }

        .ticket-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--primary);
        }

        .ticket-preview-header h2 {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--primary);
        }

        .ticket-preview-header p {
          margin: 0.2rem 0 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-dim);
          letter-spacing: 0.08em;
        }

        .ticket-preview-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .ticket-preview-badge {
          padding: 0.35rem 0.7rem;
          border-radius: 100px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ticket-preview-badge.ongoing {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
        }

        .ticket-preview-badge.completed {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .ticket-preview-badge.approved {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .ticket-preview-actions button {
          border: none;
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          cursor: pointer;
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 700;
        }

        .ticket-preview-actions .print-action {
          background: var(--primary);
          color: #fff;
        }

        .ticket-preview-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .ticket-preview-section h3 {
          margin: 0 0 0.9rem;
          font-size: 1.05rem;
          color: var(--primary);
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.45rem;
        }

        .ticket-preview-section-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .ticket-preview-field.full-width {
          grid-column: 1 / -1;
        }

        .ticket-preview-field label {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
        }

        .ticket-preview-value {
          min-height: 46px;
          padding: 0.8rem 1rem;
          border-radius: 4px;
          border: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          font-weight: 600;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .ticket-preview-value.empty {
          color: var(--text-dim);
          font-style: italic;
        }

        .dark-mode .ticket-preview-value.empty {
          color: #64748b !important;
        }

        .dark-mode select.ticket-preview-value option {
          background: #1e293b;
          color: #f8fafc;
        }

        .ticket-preview-card {
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.03);
        }

        .ticket-preview-card.accent-green {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .ticket-preview-card h4 {
          margin: 0 0 0.85rem;
          color: var(--text-main);
          font-size: 0.95rem;
        }

        .ticket-preview-card-body {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .ticket-preview-signatures {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .ticket-preview-signature {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
        }

        .signature-line {
          width: 100%;
          height: 48px;
          border-bottom: 2px solid var(--text-dim);
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 0.5rem;
        }

        .company-logo-preview {
          height: 50px;
          width: auto;
          object-fit: contain;
          margin-bottom: 0.5rem;
        }

        .ticket-preview-signature span {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        @media screen {
          .print-only {
            display: none;
          }
        }

        @media (max-width: 1024px) {
          .ticket-preview-section-grid,
          .ticket-preview-signatures {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .ticket-preview-actions,
          .ticket-preview-footer-actions,
          button,
          .no-print {
            display: none !important;
          }
          
          .ticket-preview-shell {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }

          .ticket-preview-header {
            margin-bottom: 2rem !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 1rem !important;
          }

          .ticket-preview-grid {
            gap: 1.5rem !important;
          }

          .ticket-preview-section h3 {
            border-bottom: 2px solid #000 !important;
            padding-bottom: 0.5rem !important;
            margin-bottom: 1rem !important;
          }

          .ticket-preview-card {
            background: white !important;
            border: 1.5px solid #000 !important;
            border-radius: 0 !important;
          }

          .ticket-preview-value {
            background: white !important;
            border: 1px solid #ccc !important;
            color: #000 !important;
            border-radius: 0 !important;
          }

          .signature-line {
            border-bottom: 2px solid #000 !important;
          }
        }

        @media (max-width: 768px) {
          .ticket-preview-header {
            flex-direction: column;
          }

          .ticket-preview-actions {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

function TripTicketPreview({ record, onClose, guards, onUpdate, onArchive, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuard = user.role === 'Guard';
  const isAdmin = user.role === 'Admin' || user.canApprove;

  const [formData, setFormData] = useState({
    dateTimeDeparture: record.dateTimeDeparture || '',
    dateTimeReturn: record.dateTimeReturn || '',
    kmOut: record.kmOut || '',
    kmIn: record.kmIn || '',
    guardOut: record.guardOut || '',
    guardIn: record.guardIn || ''
  });

  const isTrip = record.type === 'TRIP_TICKET';
  const isOngoing = isTrip && formData.dateTimeDeparture && !formData.dateTimeReturn;
  const isCompleted = isTrip && record.dateTimeDeparture && record.dateTimeReturn;
  const canEdit = !isCompleted; 

  const currentStatusLabel = isTrip 
    ? (isOngoing ? 'ONGOING' : (isCompleted ? 'COMPLETED' : 'APPROVED'))
    : (record.status || 'APPROVED').toUpperCase();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveLogs = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/trip-tickets/${record.id}`, formData);
      showToast('Guard logs updated successfully!', 'success');
      onUpdate({ ...record, ...response.data });
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update logs', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTrip = async () => {
    setSaving(true);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const departureTime = now.toISOString().slice(0, 16);
    
    const updatedData = { ...formData, dateTimeDeparture: departureTime, status: 'Ongoing' };
    
    try {
      const response = await api.put(`/trip-tickets/${record.id}`, updatedData);
      setFormData(updatedData);
      showToast('Trip started! Status is now ONGOING.', 'success');
      onUpdate({ ...record, ...response.data });
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start trip', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnTrip = async () => {
    setSaving(true);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const returnTime = now.toISOString().slice(0, 16);
    
    const updatedData = { ...formData, dateTimeReturn: returnTime, status: 'Completed' };
    
    try {
      const response = await api.put(`/trip-tickets/${record.id}`, updatedData);
      setFormData(updatedData);
      showToast('Trip completed! Status is now COMPLETED.', 'success');
      onUpdate({ ...record, ...response.data });
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to complete trip', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ticket-preview-shell">
      <div className="ticket-preview-header">
        <div>
          <img 
            src="/HDI Primary Logo .png" 
            alt="HDI Logo" 
            className="company-logo-preview"
          />
          <p>TRIP TICKET FORM</p>
        </div>
        <div className="ticket-preview-actions">
          <span className={`ticket-preview-badge ${currentStatusLabel.toLowerCase()}`}>
            {currentStatusLabel}
          </span>
          {!isGuard && (
            <button className="print-action" onClick={() => window.print()} style={{ background: '#6366f1' }}>
              🖨️ Print
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="ticket-preview-grid">
        <PreviewSection title="General Information">
          <PreviewField label="Date Requested" value={record.dateRequested} />
          <PreviewField label="Requestor Name" value={record.requestorName || record.requestor || record.author?.name} />
          <PreviewField label="Subsidiary/Department" value={record.subsidiary} />
        </PreviewSection>

        <PreviewSection title="Travel Details">
          <PreviewField label="Destination" value={record.destination} />
          <PreviewField label="Transportation Medium/s" value={record.medium || 'Land'} />
          <PreviewField label="Purpose of Trip" value={record.purpose} fullWidth />
          <PreviewField label="Number of Passenger" value={record.passengerCount} />
          <PreviewField label="HDI Passengers" value={record.hdiPassengers} />
          <PreviewField label="Passengers Outside of HDI" value={record.outsidePassengers} />
          <PreviewField label="Passengers Names" value={record.passengersDetail} fullWidth />
        </PreviewSection>

        <PreviewSection title="Fleet Assignment">
          <PreviewField label="Assigned Driver" value={record.driver} />
          <PreviewField label="Vehicle" value={record.vehicle} />
          <PreviewField label="Plate Number" value={record.plateNumber} />
        </PreviewSection>

        <PreviewSection title="Schedule & Logistics">
          <PreviewCard title="Planned Schedule">
            <PreviewField label="ETD (Estimated Time of Departure)" value={record.etdOffice} />
            <PreviewField label="ETA (Estimated Time of Arrival)" value={record.etaDestination} />
          </PreviewCard>
          <PreviewCard title="Actual Travel Log (Filled by Guard)" accent="green">
            <PreviewField 
              label="Actual Departure" 
              value={formData.dateTimeDeparture} 
              editable={canEdit && isGuard} 
              name="dateTimeDeparture" 
              type="datetime-local" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Actual Return" 
              value={formData.dateTimeReturn} 
              editable={canEdit && isGuard} 
              name="dateTimeReturn" 
              type="datetime-local" 
              onChange={handleChange} 
            />
          </PreviewCard>
        </PreviewSection>

        <PreviewSection title="Guard's Log (Vehicle Mileage)">
          <PreviewCard title="Departure (Out)">
            <PreviewField 
              label="KM Reading (Out)" 
              value={formData.kmOut} 
              editable={canEdit && isGuard} 
              name="kmOut" 
              type="number" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Guard on Duty (Out)" 
              value={formData.guardOut} 
              editable={canEdit && isGuard} 
              name="guardOut" 
              type="select" 
              options={guards} 
              onChange={handleChange} 
            />
          </PreviewCard>
          <PreviewCard title="Return (In)" accent="green">
            <PreviewField 
              label="KM Reading (In)" 
              value={formData.kmIn} 
              editable={canEdit && isGuard} 
              name="kmIn" 
              type="number" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Guard on Duty (In)" 
              value={formData.guardIn} 
              editable={canEdit && isGuard} 
              name="guardIn" 
              type="select" 
              options={guards} 
              onChange={handleChange} 
            />
          </PreviewCard>
        </PreviewSection>

        <div className="ticket-preview-signatures">
          <SignatureBlock label="Requested By" value={record.requestedBy || record.requestorName || record.author?.name} />
          <SignatureBlock label="Endorsed By" value={record.endorsedBy} />
          <SignatureBlock label="Approved By" value={record.approvedBy} />
        </div>

        <div className="ticket-preview-footer-actions no-print" style={{ 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '2px dashed var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {!canEdit ? null : (
            <>
              {isGuard && !formData.dateTimeDeparture && (
                <button 
                  className="print-action" 
                  onClick={handleStartTrip}
                  disabled={saving}
                  style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Starting...' : '🚀 Start Trip (Ongoing)'}
                </button>
              )}
              {isGuard && formData.dateTimeDeparture && !formData.dateTimeReturn && (
                <button 
                  className="print-action" 
                  onClick={handleReturnTrip}
                  disabled={saving}
                  style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Completing...' : '🏁 Arrived / Returned'}
                </button>
              )}
              {isGuard && (
                <button 
                  onClick={handleSaveLogs} 
                  disabled={saving}
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              )}
            </>
          )}
          
          {isAdmin && (
            <button 
              onClick={() => onArchive(record)}
              style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
            >
              📥 Archive
            </button>
          )}

          {(isAdmin || record.userId === user.id || record.requestedBy === user.name) && record.status === 'Approved' && !record.dateTimeDeparture && (
            <button 
              onClick={() => onCancel(record)}
              style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🚫 Cancel Trip
            </button>
          )}
          <button 
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ record, onClose, onArchive }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin' || user.canApprove;
  const type = record.type;
  const statusLabel = record.status === 'Archived'
    ? 'ARCHIVED'
    : record.status === 'Disapproved'
      ? 'DISAPPROVED'
      : record.status === 'Approved'
        ? 'APPROVED'
        : (record.status || 'APPROVED').toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>
            {type === 'PRF'
              ? (record.prfNo ? `PRF #${record.prfNo}` : 'Approved PRF')
              : (record.rrfNo ? `RRF #${record.rrfNo}` : 'Approved Purchase Requisition')}
          </h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-dim)' }}>{type} • {statusLabel}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => onArchive(record)}
            style={{ border: 'none', borderRadius: '10px', padding: '0.6rem 0.9rem', cursor: 'pointer', background: '#f59e0b', color: 'white', fontWeight: 700 }}
          >
            📥 Archive
          </button>
        )}
        <button
          onClick={onClose}
          style={{ border: 'none', borderRadius: '10px', padding: '0.6rem 0.9rem', cursor: 'pointer', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
        <Detail label="Requestor" value={record.requestorName || record.requestor || record.author?.name || 'N/A'} />
        <Detail label="Purpose" value={record.purpose || 'N/A'} />
      </div>
    </div>
  );
}

function PreviewSection({ title, children }) {
  return (
    <section className="ticket-preview-section">
      <h3>{title}</h3>
      <div className="ticket-preview-section-grid">{children}</div>
    </section>
  );
}

function PreviewCard({ title, accent, children }) {
  return (
    <div className={`ticket-preview-card ${accent === 'green' ? 'accent-green' : ''}`}>
      <h4>{title}</h4>
      <div className="ticket-preview-card-body">{children}</div>
    </div>
  );
}

function PreviewField({ label, value, fullWidth = false, editable = false, type = 'text', name, onChange, options = [] }) {
  return (
    <div className={`ticket-preview-field ${fullWidth ? 'full-width' : ''}`}>
      <label>{label}</label>
      {editable ? (
        type === 'select' ? (
          <select 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            className="ticket-preview-value"
            style={{ width: '100%', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Select Guard...</option>
            {options.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        ) : (
          <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            className="ticket-preview-value" 
            style={{ width: '100%', outline: 'none' }}
          />
        )
      ) : (
        <div className={`ticket-preview-value ${!value ? 'empty' : ''}`}>
          {(() => {
            if (!value) return 'N/A';
            if (type === 'datetime-local' || (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value)))) {
              try {
                return new Date(value).toLocaleString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              } catch (e) {
                return value;
              }
            }
            return value;
          })()}
        </div>
      )}
    </div>
  );
}

function SignatureBlock({ label, value }) {
  return (
    <div className="ticket-preview-signature">
      <div className="signature-line">{value || ' '}</div>
      <span>{label}</span>
    </div>
  );
}

function Detail({ label, value, fullWidth = false }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto', padding: '0.9rem 1rem', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
