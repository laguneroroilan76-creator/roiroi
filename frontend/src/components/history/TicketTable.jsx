import React from 'react';
import PremiumTable from '../shared/PremiumTable';
import StatusPill from '../shared/StatusPill';

const TicketTable = ({ tickets, onView, typeLabel }) => {
  const headers = [
    { label: 'Requestor' },
    { label: 'Type' },
    { label: 'Date' },
    { label: 'Status' },
    { label: 'Actions', style: { textAlign: 'right' } }
  ];

  return (
    <PremiumTable headers={headers} emptyMessage="No trip tickets found.">
      {tickets.map(ticket => (
        <tr key={ticket.id} className="fade-in">
          <td>
            <div className="user-info">
              <div className="avatar-small">
                {ticket.requestorName?.[0] || 'T'}
              </div>
              <span className="bold">{ticket.requestorName}</span>
            </div>
          </td>
          <td><span className="dim">{typeLabel || 'Trip Ticket'}</span></td>
          <td><span className="dim">{new Date(ticket.createdAt).toLocaleDateString()}</span></td>
          <td>
            <StatusPill status={(() => {
              const currentStatus = ticket.status?.toLowerCase();
              if (currentStatus === 'approved') {
                if (ticket.dateTimeReturn && ticket.dateTimeReturn.trim() !== '') return 'Completed';
                if (ticket.dateTimeDeparture && ticket.dateTimeDeparture.trim() !== '') return 'Ongoing';
                if (ticket.receivedBy) return 'Received';
              }
              return ticket.status;
            })()} />
          </td>
          <td style={{ textAlign: 'right' }}>
            <button className="row-action-btn" onClick={() => onView(ticket)}>
              View Details
            </button>
          </td>
        </tr>
      ))}
      <style>{`
        .user-info { display: flex; align-items: center; gap: 12px; }
        .avatar-small { 
          width: 32px; height: 32px; background: var(--primary-light); color: var(--primary); 
          border-radius: 10px; display: flex; align-items: center; justify-content: center; 
          font-weight: 800; font-size: 0.8rem; flex-shrink: 0;
        }
        .bold { font-weight: 700; color: var(--text-main); }
        .dim { color: var(--text-dim); font-size: 0.9rem; }
        .row-action-btn { 
          background: var(--primary-light); color: var(--primary); border: none; 
          padding: 8px 18px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; 
          cursor: pointer; transition: all 0.2s; 
        }
        .row-action-btn:hover { background: var(--primary); color: white; transform: translateY(-2px); }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PremiumTable>
  );
};

export default TicketTable;
