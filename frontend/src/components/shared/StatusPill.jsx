import React from 'react';

const StatusPill = ({ status }) => {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  
  const getStyles = () => {
    switch (normalizedStatus) {
      case 'approved':
        return { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', label: 'APPROVED' };
      case 'archived':
        return { background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', label: 'ARCHIVED' };
      case 'disapproved':
      case 'rejected':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'DISAPPROVED' };
      case 'cancelled':
        return { background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', label: 'CANCELLED' };
      case 'ongoing':
        return { background: 'rgba(15, 23, 42, 0.1)', color: '#0f172a', label: 'ONGOING' };
      case 'completed':
        return { background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', label: 'COMPLETED' };
      case 'received':
        return { background: 'rgba(15, 23, 42, 0.12)', color: '#0f172a', label: 'RECEIVED' };
      default:
        return { background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', label: status?.toUpperCase() || 'PENDING' };
    }
  };

  const { background, color, label } = getStyles();

  return (
    <span style={{
      padding: '5px 14px',
      borderRadius: '100px',
      fontSize: '0.7rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background,
      color,
      display: 'inline-block'
    }}>
      {label}
    </span>
  );
};

export default StatusPill;
