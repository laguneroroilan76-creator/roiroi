import React from 'react';
import { Detail } from './PreviewComponents';
import { Archive } from 'lucide-react';

export default function GenericPreview({ record, onClose, onArchive }) {
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
              ? (record.prfNo ? `PRF #${record.prfNo}` : 'Approved Purchase Requisition')
              : (record.rfpNo ? `RFP #${record.rfpNo}` : 'Approved Request For Payment')}
          </h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-dim)' }}>{type} • {statusLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button
              onClick={() => onArchive(record)}
              style={{ border: 'none', borderRadius: '10px', padding: '0.6rem 0.9rem', cursor: 'pointer', background: '#334155', color: 'white', fontWeight: 700 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Archive size={16} /> Archive</div>
            </button>
          )}
          <button
            onClick={onClose}
            style={{ border: 'none', borderRadius: '10px', padding: '0.6rem 0.9rem', cursor: 'pointer', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}
          >
            Close
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
        <Detail label="Requestor" value={record.requestorName || record.requestor || record.author?.name || 'N/A'} />
        <Detail label="Department / Company" value={`${record.department || 'N/A'} / ${record.company || 'N/A'}`} />
        
        <Detail label="Date Requested" value={record.dateRequested || 'N/A'} />
        <Detail label="Date Needed" value={record.dateNeeded || 'N/A'} />
        
        <Detail label="Verified By" value={record.verifiedBy || 'N/A'} />
        <Detail label="Approved By" value={record.approvedBy || 'N/A'} />
        
        <Detail label="Purpose / Remarks" value={record.purpose || record.remarks || 'N/A'} />
      </div>
    </div>
  );
}
