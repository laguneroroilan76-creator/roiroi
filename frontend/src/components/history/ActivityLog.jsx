import React, { useEffect, useState } from 'react';
import { User, Loader } from 'lucide-react';
import api from '../../services/api';

const ActivityLog = ({ onViewResource }) => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/activity/logs?page=${currentPage}&limit=${pageSize}`);
        if (res.data.logs) {
          setLogs(res.data.logs);
          setTotalPages(res.data.totalPages);
        } else {
          setLogs(res.data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
          setTotalPages(Math.ceil(res.data.length / pageSize));
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [currentPage]);

  const formatLogDetails = (log) => {
    const details = log.details || '';

    if (log.resource === 'TRIP_TICKET' && log.user?.name && /approved trip ticket/i.test(details)) {
      return `${log.user.name} updated Trip Ticket guard log`;
    }

    if (log.resource === 'TRIP_TICKET' && /approved trip ticket/i.test(details) && /guard/i.test(details)) {
      return details.replace(/approved trip ticket/ig, 'updated Trip Ticket guard log');
    }

    return details;
  };

  const renderPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 2) {
      endPage = Math.min(totalPages, 5);
    }
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-num-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="activity-list-container fade-in">
      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><Loader className="spin" /></div>}
      
      {!loading && logs.map(log => (
        <div key={log.id} className="activity-card-compact">
          <div className="card-top-compact">
            <span className={`resource-tag-compact ${log.resource}`}>
              {log.resource.replace('_', ' ')}
            </span>
            <span className="timestamp-compact">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
          <div className="log-details-compact">{formatLogDetails(log)}</div>
          <div className="card-bottom-compact">
            <span className="user-tag-compact" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> {log.user?.name || 'System'}
            </span>
            <button className="inline-btn-compact" onClick={() => onViewResource(log)}>
              View Reference
            </button>
          </div>
        </div>
      ))}
      
      {!loading && logs.length === 0 && (
        <div className="empty-row glass" style={{ padding: '4rem', textAlign: 'center' }}>
          No system activity recorded yet.
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-bar glass">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </button>
          <div className="page-numbers-container">
            {renderPageNumbers()}
          </div>
          <button
            className="page-btn"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </button>
        </div>
      )}

      <style>{`
        .activity-list-container { display: flex; flex-direction: column; gap: 0.6rem; }
        .activity-card-compact { background: var(--card-bg); padding: 0.85rem 1.25rem; border-radius: 12px; border: 1px solid var(--glass-border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.2s; }
        .activity-card-compact:hover { border-color: var(--primary-light); transform: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .card-top-compact { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .resource-tag-compact { padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; background: rgba(0,0,0,0.05); color: var(--text-dim); }
        .resource-tag-compact.TRIP_TICKET { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .resource-tag-compact.PRF { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .timestamp-compact { font-size: 0.75rem; color: var(--text-dim); }
        .log-details-compact { font-size: 0.9rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem; line-height: 1.4; }
        .card-bottom-compact { display: flex; justify-content: space-between; align-items: center; }
        .user-tag-compact { font-size: 0.75rem; font-weight: 600; color: var(--text-dim); }
        .inline-btn-compact { background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 0.7rem; cursor: pointer; transition: all 0.2s; }
        .inline-btn-compact:hover { background: var(--primary); color: white; }
        
        .pagination-bar {
          display: flex; align-items: center; justify-content: center; gap: 2rem;
          padding: 0.75rem 1.5rem; border-radius: 12px; margin: 1rem auto 0 auto;
          background: var(--card-bg); border: 1px solid var(--glass-border); width: fit-content;
        }
        .page-btn {
          border: 1px solid var(--primary); background: var(--primary-light);
          color: var(--primary); border-radius: 8px; padding: 0.4rem 0.8rem;
          font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s;
        }
        .page-btn:hover:not(:disabled) { background: var(--primary); color: white; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--glass-border); color: var(--text-muted); background: transparent; }
        .page-info { font-weight: 600; font-size: 0.8rem; color: var(--text-dim); }
        .page-numbers-container { display: flex; gap: 0.35rem; align-items: center; }
        .page-num-btn {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid transparent; background: transparent;
          font-weight: 700; font-size: 0.8rem; color: var(--text-dim); cursor: pointer; transition: 0.2s;
        }
        .page-num-btn:hover { background: rgba(0,0,0,0.05); color: var(--text-main); }
        .page-num-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; color: var(--primary); }
        
        @media (max-width: 768px) {
          .activity-card-compact { padding: 0.75rem 1rem; }
          .log-details-compact { font-size: 0.85rem; }
          .pagination-bar { flex-direction: column; gap: 1rem; padding: 1rem; }
          .card-top-compact { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
          .card-bottom-compact { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default ActivityLog;
