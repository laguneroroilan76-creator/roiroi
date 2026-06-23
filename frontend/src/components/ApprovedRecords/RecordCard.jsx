import React from 'react';

export default function RecordCard({ record, type, onClick, onArchive, onCancel, isAdmin, isGuard, user }) {
  return (
    <div className="record-card glass" onClick={onClick} style={{ cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
              background: type === 'TRIP_TICKET' ? 'rgba(15, 23, 42, 0.1)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
              color: type === 'TRIP_TICKET' ? '#818cf8' : (type === 'PRF' ? '#10b981' : '#334155'),
              border: `1px solid ${type === 'TRIP_TICKET' ? 'rgba(15, 23, 42, 0.2)' : (type === 'PRF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`
            }}>
              {type === 'TRIP_TICKET' ? 'TRIP TICKET' : (type === 'PRF' ? 'PRF' : 'RFP')}
            </span>
            {type === 'TRIP_TICKET' && record.dateTimeDeparture && !record.dateTimeReturn && (
              <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#0f172a', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>DEPARTED</span>
            )}
            {type === 'TRIP_TICKET' && record.dateTimeDeparture && record.dateTimeReturn && (
              <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#10b981', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>ARRIVED</span>
            )}
            {type === 'TRIP_TICKET' && !record.dateTimeDeparture && (
              <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '0.65rem', fontWeight: 900 }}>APPROVED</span>
            )}
            {type === 'RFP' && record.receivedBy && (
              <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#0f172a', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>RECEIVED</span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {new Date(record.createdAt).toLocaleString('en-US', {
              month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            })}
          </span>
        </div>

        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
          {type === 'TRIP_TICKET' 
            ? (record.requestorName || record.author?.name || 'Unnamed Request') 
            : (type === 'PRF' 
                ? (record.requestor || record.author?.name || (record.prfNo ? `PRF #${record.prfNo}` : 'Unnamed PRF'))
                : (record.requestor || record.author?.name || (record.rfpNo ? `RFP #${record.rfpNo}` : 'Unnamed RFP'))
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
          ? 'rgba(15, 23, 42, 0.08)' 
          : 'rgba(34, 197, 94, 0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        marginTop: 'auto'
      }}>
        <div className="no-print" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onArchive(record); }}
                className="action-btn-mini archive"
              >
                Archive
              </button>
              {type === 'TRIP_TICKET' && record.status === 'Approved' && !record.dateTimeDeparture && (isAdmin || record.userId === user.id || record.requestedBy === user.name) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onCancel(record); }}
                  className="action-btn-mini cancel"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
