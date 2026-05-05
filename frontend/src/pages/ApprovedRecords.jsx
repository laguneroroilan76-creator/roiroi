import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './ApprovedRecords.css';

// Sub-components
import RecordCard from '../components/ApprovedRecords/RecordCard';
import PrintTripTicket from '../modules/TripTicket/PrintTripTicket';

export default function ApprovedRecords() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentFilter = location.state?.filter;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuard = user.role === 'Guard';
  const isAdmin = user.role === 'Admin' || user.canApprove;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
        api.get('/trip-tickets'),
        api.get('/prfs'),
        api.get('/rfps')
      ]);

      const parseRecord = (record) => {
        if (!record.layout) return record;
        try {
          const parsed = JSON.parse(record.layout);
          // Prioritize database fields for status and approvals to avoid stale data in layout blob
          return { 
            ...parsed,
            ...record,
            status: record.status || parsed.status,
            approvedBy: record.approvedBy || parsed.approvedBy,
            verifiedBy: record.verifiedBy || parsed.verifiedBy,
            preparedBy: record.preparedBy || parsed.preparedBy,
            receivedBy: record.receivedBy || parsed.receivedBy,
            receivedDate: record.receivedDate || parsed.receivedDate
          };
        } catch (e) { return record; }
      };

      const allApproved = [
        ...ticketsRes.data.filter(t => ['Approved', 'Completed', 'Ongoing', 'DEPARTED', 'ARRIVED'].includes(t.status)).map(t => ({ ...parseRecord(t), type: 'TRIP_TICKET' })),
        ...(!isGuard ? prfsRes.data.filter(p => p.status === 'Approved' || p.status === 'Completed').map(p => ({ ...parseRecord(p), type: 'PRF' })) : []),
        ...(!isGuard ? rrfsRes.data.filter(r => r.status === 'Approved' || r.status === 'Completed').map(r => ({ ...parseRecord(r), type: 'RFP' })) : [])
      ];

      setRecords(allApproved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      showToast('Failed to fetch records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (record) => {
    if (isGuard) return;
    const confirmed = await confirm('Archive this document?');
    if (!confirmed) return;
    try {
      let endpoint = '';
      const type = getRecordType(record);
      if (type === 'TRIP_TICKET') endpoint = `/trip-tickets/${record.id}`;
      else if (type === 'PRF') endpoint = `/prfs/${record.id}`;
      else if (type === 'RRF' || type === 'RFP') endpoint = `/rfps/${record.id}`;

      await api.put(endpoint, { status: 'Archived' });
      showToast('Archived successfully!', 'success');
      fetchData();
    } catch (err) { showToast('Failed to archive', 'error'); }
  };

  const handleCancel = async (record) => {
    const confirmed = await confirm('Cancel this approved trip?');
    if (!confirmed) return;
    try {
      await api.put(`/trip-tickets/${record.id}`, { status: 'Cancelled' });
      showToast('Trip Cancelled!', 'success');
      fetchData();
    } catch (err) { showToast('Failed to cancel trip', 'error'); }
  };

  const getRecordType = (record) => {
    return record.type || record.docType || record.formType || (
      record.prfNo ? 'PRF' : (record.rrfNo ? 'RFP' : 'TRIP_TICKET')
    );
  };

  const handleView = (record) => {
    const type = getRecordType(record);
    const route = type === 'TRIP_TICKET' ? '/trip-ticket' : (type === 'PRF' ? '/prf' : '/rfp');
    navigate(route, { state: { initialData: record, readOnly: true, isInbox: location.state?.isInbox } });
  };

  return (
    <div className="approved-records-page">
      <div className="approved-header-section">
        <div className="header-icon-wrapper">
        </div>
        <div className="header-text">
          <h1>
            {location.state?.isInbox ? 'RFP Inbox' : (
             currentFilter === 'TRIP_TICKET' ? 'Approved Trip Tickets' : 
             currentFilter === 'PRF' ? 'Approved Purchase Requisitions' : 
             (currentFilter === 'RRF' || currentFilter === 'RFP') ? 'Approved Requests For Payment' : 
             'Approved Records'
            )}
          </h1>
          <p>
            {location.state?.isInbox ? 'Viewing pending payment requests and receipts.' : (
              currentFilter ? `Viewing all authorized ${currentFilter.replace('_', ' ').toLowerCase()}s.` : 'Viewing all validated and authorized documents.'
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="records-grid">
          {records
            .filter(record => {
              if (location.state?.isInbox) {
                // RFP Inbox: Only show RFPs that are Approved and NOT yet received
                const isRFP = getRecordType(record) === 'RFP';
                const hasAccess = user.canApprove || record.authorId === user.id || user.role === 'Accounting';
                return isRFP && hasAccess;
              }
              const matchesFilter = !currentFilter || getRecordType(record) === currentFilter;
              const isOwn = record.authorId === user.id;
              const isAdminOrApprover = user.role === 'Admin' || user.canApprove;
              
              return matchesFilter && (isAdminOrApprover || isOwn);
            })
            .map((record) => (
            <RecordCard 
              key={`${getRecordType(record)}-${record.id}`}
              record={record}
              type={getRecordType(record)}
              onClick={() => handleView(record)}
              onArchive={handleArchive}
              onCancel={handleCancel}
              isAdmin={isAdmin}
              isGuard={isGuard}
              user={user}
            />
          ))}
        </div>
      )}

      {selectedRecord && getRecordType(selectedRecord) === 'TRIP_TICKET' && (
        <PrintTripTicket ticket={selectedRecord} />
      )}
    </div>
  );
}
