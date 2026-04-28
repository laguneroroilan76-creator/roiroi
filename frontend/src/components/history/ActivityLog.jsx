import React from 'react';

const ActivityLog = ({ logs, onViewResource }) => {
  return (
    <div className="activity-list-container fade-in">
      {logs.map(log => (
        <div key={log.id} className="activity-card">
          <div className="card-top">
            <span className={`resource-tag ${log.resource}`}>
              {log.resource.replace('_', ' ')}
            </span>
            <span className="timestamp">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
          <div className="log-details">{log.details}</div>
          <div className="card-bottom">
            <span className="user-tag">👤 {log.user?.name || 'System'}</span>
            <button className="inline-btn" onClick={() => onViewResource(log)}>
              View Reference
            </button>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="empty-row glass" style={{ padding: '4rem', textAlign: 'center' }}>
          No system activity recorded yet.
        </div>
      )}

      <style>{`
        .activity-list-container { display: flex; flex-direction: column; gap: 1rem; }
        .activity-card { background: var(--card-bg); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--glass-border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.3s; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .resource-tag { padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; background: rgba(0,0,0,0.05); color: var(--text-dim); }
        .resource-tag.TRIP_TICKET { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .resource-tag.PRF { background: rgba(16, 185, 129, 0.1); color: #34d399; }
        .timestamp { font-size: 0.8rem; color: var(--text-dim); }
        .log-details { font-size: 1.05rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; }
        .card-bottom { display: flex; justify-content: space-between; align-items: center; }
        .user-tag { font-size: 0.85rem; font-weight: 700; color: var(--text-dim); }
        .inline-btn { background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 5px 15px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .inline-btn:hover { background: var(--primary); color: white; }
      `}</style>
    </div>
  );
};

export default ActivityLog;
