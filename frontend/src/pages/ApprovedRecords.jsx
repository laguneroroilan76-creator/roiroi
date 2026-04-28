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
  const { showToast } = useToast();

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
        ...prfsRes.data.filter(p => p.status === 'Approved').map(p => ({ ...p, type: 'PRF' })),
        ...rrfsRes.data.filter(r => r.status === 'Approved').map(r => ({ ...r, type: 'RRF' }))
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
    if (!window.confirm('Are you sure you want to archive this document?')) return;
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

  const getRecordType = (record) => {
    return record.type || record.docType || record.formType || (
      record.prfNo ? 'PRF' : (record.rrfNo ? 'RRF' : 'TRIP_TICKET')
    );
  };

  const handleView = (record) => {
    setSelectedRecord({ ...record, type: getRecordType(record) });
  };

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-main)' }}>Loading Approved Records...</div>;

  return (
    <div className="approved-records-page" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>✅ Approved Records</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem' }}>View and print all authorized documents in one place.</p>
      </header>

      <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {records.map(record => {
          const type = getRecordType(record);
          return (
          <div key={`${type}-${record.id}`} className="record-card glass" onClick={() => handleView(record)} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ 
                        padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                background: type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.1)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                color: type === 'TRIP_TICKET' ? '#818cf8' : (type === 'PRF' ? '#10b981' : '#f59e0b'),
                border: `1px solid ${type === 'TRIP_TICKET' ? 'rgba(99, 102, 241, 0.2)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`
                    }}>
                {type === 'TRIP_TICKET' ? '🚗 TRIP TICKET' : (type === 'PRF' ? '📄 PRF' : '📄 RRF')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(record.createdAt).toLocaleDateString()}
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
                background: 'rgba(34, 197, 94, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem' }}>AUTHORIZED</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleArchive(record); }}
                        style={{ 
                            background: 'rgba(245, 158, 11, 0.1)', 
                            border: '1px solid rgba(245, 158, 11, 0.2)', 
                            borderRadius: '8px', 
                            padding: '4px 8px', 
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        📥 Archive
                    </button>
                </div>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>View Full Document ›</span>
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
              <TripTicketPreview record={selectedRecord} onClose={() => setSelectedRecord(null)} guards={guards} onUpdate={handleUpdateRecord} onArchive={handleArchive} />
            ) : (
              <GenericPreview record={selectedRecord} onClose={() => setSelectedRecord(null)} onArchive={handleArchive} />
            )}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 12px;
          }

          .approved-records-page > header,
          .records-grid,
          .record-card,
          .ticket-preview-actions button:not(.print-action),
          .ticket-preview-actions .ticket-preview-badge,
          .ticket-preview-actions button:last-child {
            display: none !important;
          }

          .approved-records-page {
            padding: 0 !important;
            background: #fff !important;
          }

          .approved-records-page > div:first-of-type {
            display: none !important;
          }

          .approved-records-page > div[style*="position: fixed"] {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            display: block !important;
          }

          .approved-records-page > div[style*="position: fixed"] > div {
            box-shadow: none !important;
            background: #fff !important;
            border: none !important;
            padding: 0 !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            transform: scale(0.94);
            transform-origin: top left;
          }

          .ticket-preview-shell {
            gap: 0.9rem !important;
          }

          .ticket-preview-section-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.6rem !important;
          }

          .ticket-preview-signatures {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
            break-inside: avoid;
          }

          .ticket-preview-card,
          .ticket-preview-value,
          .signature-line {
            background: #fff !important;
          }

          .ticket-preview-card,
          .ticket-preview-field,
          .ticket-preview-signature,
          .ticket-preview-section {
            break-inside: avoid;
          }
          /* try to keep single-page by reducing gaps */
          .ticket-preview-shell { gap: 0.6rem !important; }
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
          border-radius: 12px;
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
          border-radius: 18px;
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
          min-height: 42px;
          border-bottom: 2px solid var(--text-dim);
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 0.35rem;
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

function TripTicketPreview({ record, onClose, guards, onUpdate, onArchive }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuard = user.role === 'Guard';
  const isAdmin = user.role === 'Admin' || user.canApprove;
  const canEdit = isGuard || isAdmin;

  const [formData, setFormData] = useState({
    dateTimeDeparture: record.dateTimeDeparture || '',
    dateTimeReturn: record.dateTimeReturn || '',
    kmOut: record.kmOut || '',
    kmIn: record.kmIn || '',
    guardOut: record.guardOut || '',
    guardIn: record.guardIn || ''
  });

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

  return (
    <div className="ticket-preview-shell">
      <div className="ticket-preview-header">
        <div>
          <h2>HDI ADVENTURES INC.</h2>
          <p>TRIP TICKET FORM</p>
        </div>
        <div className="ticket-preview-actions">
          <span className="ticket-preview-badge">{record.status || 'Approved'}</span>
          {canEdit && (
            <button 
              className="print-action" 
              onClick={handleSaveLogs} 
              disabled={saving}
              style={{ background: '#10b981' }}
            >
              {saving ? 'Saving...' : '💾 Save Logs'}
            </button>
          )}
          {isAdmin && (
            <button 
              className="print-action" 
              onClick={() => onArchive(record)}
              style={{ background: '#f59e0b' }}
            >
              📥 Archive
            </button>
          )}
          <button className="print-action" onClick={() => window.print()}>Print</button>
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
          <PreviewField label="Passengers Details" value={record.passengersDetail} fullWidth />
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
              editable={canEdit} 
              name="dateTimeDeparture" 
              type="datetime-local" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Actual Return" 
              value={formData.dateTimeReturn} 
              editable={canEdit} 
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
              editable={canEdit} 
              name="kmOut" 
              type="number" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Guard on Duty (Out)" 
              value={formData.guardOut} 
              editable={canEdit} 
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
              editable={canEdit} 
              name="kmIn" 
              type="number" 
              onChange={handleChange} 
            />
            <PreviewField 
              label="Guard on Duty (In)" 
              value={formData.guardIn} 
              editable={canEdit} 
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
      </div>
    </div>
  );
}

function GenericPreview({ record, onClose, onArchive }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin' || user.canApprove;
  const type = record.type;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>
            {type === 'PRF'
              ? (record.prfNo ? `PRF #${record.prfNo}` : 'Approved PRF')
              : (record.rrfNo ? `RRF #${record.rrfNo}` : 'Approved RRF')}
          </h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-dim)' }}>{type} • {record.status || 'Approved'}</p>
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
        <div className={`ticket-preview-value ${!value ? 'empty' : ''}`}>{value || 'N/A'}</div>
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
