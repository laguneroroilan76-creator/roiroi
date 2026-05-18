import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle, 
  ArrowRight, 
  Layers,
  ChevronRight,
  ClipboardList,
  Inbox
} from 'lucide-react';

export default function PendingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDarkMode = document.body.classList.contains('dark-mode');

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
        ...prfsRes.data.filter(p => p.status === 'Pending' || p.status === 'Pending Verification' || p.status === 'Pending Approval' || !p.status).map(p => ({
            ...parseRecord(p),
            docType: 'PRF',
            displayType: 'PRF',
            apiEndpoint: '/prfs',
            requestorName: p.requestor || p.author?.name || `PRF #${p.prfNo || p.id}`,
            status: p.status || 'Pending Verification'
        })),
        ...rrfsRes.data.filter(r => r.status === 'Pending' || r.status === 'Pending Dept Head Approval' || r.status === 'Pending Final Approval' || (r.status === 'Approved' && !r.receivedBy) || !r.status).map(r => ({
            ...parseRecord(r),
            docType: 'RFP',
            displayType: 'RFP',
            apiEndpoint: '/rfps',
            requestorName: r.requestor || r.author?.name || `RFP #${r.rrfNo || r.id}`,
            status: r.status || 'Pending Dept Head Approval'
        }))
      ];

      const filteredPending = allPending.filter(record => {
        const isAdmin = user?.role === 'Admin' || user?.canApprove;
        
        // Granular filtering per document type
        if (record.docType === 'TRIP_TICKET') {
            const isTTApprover = isAdmin || user?.canApproveTripTicket;
            const isTTEndorser = isAdmin || user?.canEndorse;

            if (record.status === 'Pending Endorsement') {
                return isTTEndorser || isTTApprover || record.authorId === user.id;
            }
            if (record.status === 'Pending Approval') {
                return isTTApprover || record.authorId === user.id;
            }
            return isTTApprover || record.authorId === user.id;
        }

        if (record.docType === 'PRF') {
            const isPRFApprover = isAdmin || user?.canApprovePRF;
            const isPRFVerifier = isAdmin || user?.canVerify;

            if (record.status === 'Pending Verification') {
                return isPRFVerifier || isPRFApprover || record.authorId === user.id;
            }
            if (record.status === 'Pending Approval') {
                return isPRFApprover || record.authorId === user.id;
            }
            return isPRFApprover || record.authorId === user.id;
        }

        if (record.docType === 'RFP') {
            const isRFPApprover = isAdmin || user?.canApproveRFP || user?.role === 'Accounting';
            const isRFPDeptHead = isAdmin || user?.canApproveDeptHead;

            if (record.status === 'Pending Dept Head Approval') {
                return isRFPDeptHead || isRFPApprover || record.authorId === user.id;
            }
            if (record.status === 'Pending Final Approval') {
                return isRFPApprover || record.authorId === user.id;
            }
            if (record.status === 'Pending Accounting') {
                return isRFPApprover || record.authorId === user.id;
            }
            return isRFPApprover || record.authorId === user.id;
        }

        return record.authorId === user.id || isAdmin;
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

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.requestorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || r.docType === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="pending-records-page" style={{ padding: '3rem' }}>Loading pending documents...</div>;

  return (
    <div className={`pending-records-page ${isDarkMode ? 'dark-mode' : ''}`} style={{ padding: '2rem 3rem' }}>
      <header className="page-header" style={{ marginBottom: '3rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Pending Approvals</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="toolbar-glass">
        <div className="search-box-premium">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by requestor or author..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group-premium">
          <div className="filter-item-premium">
            <Filter size={16} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Document Types</option>
              <option value="TRIP_TICKET">Trip Tickets (TT)</option>
              <option value="PRF">Purchase Requests (PRF)</option>
              <option value="RFP">Payment Requests (RFP)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container-glass">
        <table className="corporate-table">
          <thead>
            <tr>
              <th>Document Details</th>
              <th>Submitted By</th>
              <th>Current Status</th>
              <th>Submission Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={`${record.docType}-${record.id}`} onClick={() => handleReview(record)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="cell-document">
                    <div className="cell-icon-box">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="cell-text-main">{record.requestorName}</div>
                      <div className="cell-text-sub">
                        {record.displayType} #{record.id.toString().padStart(4, '0')}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                      {record.author?.name?.[0] || 'U'}
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{record.author?.name || 'User'}</span>
                  </div>
                </td>
                <td>
                  {(() => {
                    const isPendingAccounting = record.docType === 'RFP' && record.status === 'Approved' && !record.receivedBy;
                    const displayStatusText = isPendingAccounting ? 'Pending Accounting' : record.status;
                    const isOrange = record.status === 'Pending Approval' || record.status === 'Pending Final Approval' || isPendingAccounting;
                    return (
                      <span className="status-pill-premium" style={{ 
                        background: isOrange
                          ? 'rgba(249, 115, 22, 0.1)' // Orange for final/accounting approval stage
                          : 'rgba(245, 158, 11, 0.1)', // Yellow for initial pending stage
                        color: isOrange
                          ? '#f97316'
                          : '#334155'
                      }}>
                        <Clock size={12} /> {displayStatusText?.toUpperCase() || 'PENDING'}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="action-btn-premium primary" onClick={(e) => { e.stopPropagation(); handleReview(record); }}>
                      REVIEW <ArrowRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '6rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'var(--text-dim)' }}>
                    <div style={{ padding: '2rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', opacity: 0.8 }}>
                      <Inbox size={64} strokeWidth={1} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>All caught up!</h2>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>No documents matching your criteria are pending approval.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

