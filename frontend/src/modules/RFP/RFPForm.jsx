import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlusCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Styles
import './RFPForm.css';

export default function RFPForm() {
  const { showToast, confirm } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const getName = (val) => val && typeof val === 'object' ? val.name : val;

  const getDefaultFormData = () => {
    const stateInitialData = location.state?.initialData;
    return {
      rfpNo: stateInitialData?.rfpNo || stateInitialData?.rfpNo || '',
      dateRequested: stateInitialData?.dateRequested || new Date().toISOString().split('T')[0],
      dateNeeded: stateInitialData?.dateNeeded || '',
      company: stateInitialData?.company || user?.company?.name || '',
      chargeTo: stateInitialData?.chargeTo || '',
      releaseFundsTo: stateInitialData?.releaseFundsTo || '',
      amount: stateInitialData?.amount || '',
      purpose: stateInitialData?.purpose || '',
      poNumber: stateInitialData?.poNumber || '',
      siNumber: stateInitialData?.siNumber || '',
      receivedBy: getName(stateInitialData?.receivedBy) || '',
      receivedDate: stateInitialData?.receivedDate || '',
      prfNo: stateInitialData?.prfNo || '',
      status: stateInitialData?.status || 'Pending',
      requestor: getName(stateInitialData?.requestor) || (user?.role === 'Admin' ? user.name : user.name || ''),
      approvedBy: getName(stateInitialData?.approvedBy) || '',
      deptHead: getName(stateInitialData?.deptHead) || '',
      disapprovalReason: stateInitialData?.disapprovalReason || ''
    };
  };

  const [formData, setFormData] = useState(getDefaultFormData());
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    setFormData(getDefaultFormData());
    api.get('/companies').then(res => setCompanies(res.data)).catch(console.error);
  }, [location.state]);

  const parseRecord = (record) => {
    if (!record) return null;
    let parsed = {};
    if (record.layout) {
      try {
        parsed = JSON.parse(record.layout);
      } catch (e) { }
    }
    
    return { 
      ...parsed,
      ...record,
      status: record.status || parsed.status || 'Pending',
      approvedBy: getName(record.approvedBy) || getName(parsed.approvedBy),
      verifiedBy: getName(record.verifiedBy) || getName(parsed.verifiedBy),
      preparedBy: getName(record.preparedBy) || getName(parsed.preparedBy),
      deptHead: getName(record.deptHead) || getName(parsed.deptHead),
      requestor: getName(record.requestor) || getName(parsed.requestor),
      receivedBy: getName(record.receivedBy) || getName(parsed.receivedBy)
    };
  };

  useEffect(() => {
    const fetchLatest = async () => {
      if (initialData?.id) {
        try {
          const res = await api.get(`/rfps/${initialData.id}`);
          if (res.data) {
            const parsed = parseRecord(res.data);
            setFormData(prev => ({
              ...prev,
              ...parsed
            }));
          }
        } catch (err) {
          console.error("Error fetching latest RFP data:", err);
        }
      }
    };
    fetchLatest();
  }, [initialData?.id]);

  const [disReason, setDisReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);

  const isAdmin = user?.role === 'Admin' || user?.canApprove;
  const isGuard = user?.role === 'Guard';
  const isAccounting = user?.role === 'Accounting';
  const isPending = formData.status === 'Pending' && !!initialData;
  const isReadOnly = location.state?.readOnly || !!initialData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, requestor: user?.name || 'Unknown' };
      delete payload.layout;
      delete payload.status;
      if (initialData?.id) {
        await api.put(`/rfps/${initialData.id}`, payload);
      } else {
        await api.post('/rfps', payload);
      }
      showToast('Saved Successfully!', 'success');
      initialData ? navigate(-1) : navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Error saving RFP';
      showToast(msg, 'error');
    }
  };

  const handleDeptHeadApprove = async () => {
    if (!await confirm('Approve as Dept Head?')) return;
    try {
      const payload = { 
        ...formData,
        deptHead: formData.deptHead || user.name || 'Dept Head'
      };
      delete payload.layout;
      await api.post(`/rfps/${initialData.id}/approve_dept`, payload);
      showToast('Dept Head Approved!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast('Error approving', 'error');
    }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this RFP?')) return;
    try {
      const payload = { 
        ...formData,
        approvedBy: formData.approvedBy || user.name || 'System Admin'
      };
      delete payload.layout;
      await api.post(`/rfps/${initialData.id}/approve`, payload);
      showToast('Approved!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast('Error approving', 'error');
    }
  };

  const handleDisapprove = () => {
    setShowReasonModal(true);
  };

  const confirmDisapprove = async () => {
    try {
      const payload = { ...formData, disapprovalReason: disReason };
      delete payload.layout;
      await api.post(`/rfps/${initialData.id}/reject`, payload);
      showToast('Disapproved', 'info');
      navigate('/pending');
    } catch (err) {
      showToast('Error disapproving', 'error');
    }
  };

  const handleReceive = async () => {
    if (!await confirm('Mark this RFP as Received?')) return;
    try {
      const response = await api.post(`/rfps/${initialData.id}/receive`);
      showToast('RFP Received!', 'success');
      setFormData(response.data);
      // Update history state so refreshes load the received data
      navigate(location.pathname, { 
        state: { 
          ...location.state, 
          initialData: response.data
        }, 
        replace: true 
      });
    } catch (err) {
      showToast('Error receiving RFP', 'error');
    }
  };

  const handleCancelRequest = async () => {
    if (!await confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.post(`/rfps/${initialData.id}/cancel`);
      showToast('Request Cancelled', 'info');
      initialData ? navigate(-1) : navigate('/dashboard');
    } catch (err) { showToast('Error cancelling request', 'error'); }
  };

  const isOwner = initialData?.authorId === user?.id || initialData?.requestor === user?.name;

  console.log("RFP Render state:", { isReviewMode, status: formData.status, role: user?.role, initialData });
  const isFieldDisabled = (fieldName, readOnly) => {
    if (!initialData) return false;
    // Signature fields should always be locked for non-authorities
    if (fieldName === 'deptHead' || fieldName === 'approvedBy') {
      if (formData.status === 'Pending Dept Head Approval' && fieldName === 'deptHead') return !(user?.role === 'Admin' || user?.canApprove || user?.canApproveDeptHead);
      if (formData.status === 'Pending Final Approval' && fieldName === 'approvedBy') return !(user?.role === 'Admin' || user?.canApprove || user?.canApproveRFP);
      return true;
    }

    if (formData.status !== 'Pending') {
      if (isAccounting && formData.status === 'Approved' && ['rfpNo', 'prfNo', 'poNumber', 'siNumber'].includes(fieldName)) return false;
      return true;
    }
    if (readOnly) {
      return true;
    }
    return false;
  };


  return (
    <div className="custom-form-page">
      <div className="sticky-toolbar office-toolbar no-print">
        <div className="tool-group">
          <button onClick={() => initialData ? navigate(-1) : navigate('/dashboard')} className="tool-btn back">Back</button>
        </div>
        <div className="tool-group">
          {!isGuard && formData.status === 'Approved' && formData.receivedBy && (
            <button className="tool-btn print-btn" onClick={() => window.print()} style={{ background: '#334155', color: 'white', marginRight: '10px' }}>Print</button>
          )}
          {isReviewMode && (
            <>
              {((formData.status === 'Pending Dept Head Approval' || formData.status === 'Pending')) && (user?.role === 'Admin' || user?.canApprove || user?.canApproveDeptHead) && (
                <>
                  <button onClick={handleDeptHeadApprove} className="tool-btn approve" style={{ background: '#2563eb', color: '#ffffff' }}>Approve Dept Head</button>
                  <button onClick={handleDisapprove} className="tool-btn disapprove" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}>Disapprove</button>
                </>
              )}
              {formData.status === 'Pending Final Approval' && (user?.role === 'Admin' || user?.canApprove || user?.canApproveRFP) && (
                <>
                  <button onClick={handleApprove} className="tool-btn approve" style={{ background: '#2563eb', color: '#ffffff' }}>Approve Final</button>
                  <button onClick={handleDisapprove} className="tool-btn disapprove" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}>Disapprove</button>
                </>
              )}
            </>
          )}
          {isAccounting && formData.status === 'Approved' && !formData.receivedBy && (
            <>
              <button onClick={handleReceive} className="tool-btn receive-btn" style={{ background: '#2563eb', color: 'white', marginRight: '10px' }}>Receive RFP</button>
              <button onClick={handleCancelRequest} className="tool-btn cancel" style={{ background: '#64748b', color: 'white', marginRight: '10px' }}>Cancel</button>
            </>
          )}
          {formData.receivedBy && <div className="status-badge received" style={{ background: '#0f172a', color: 'white', padding: '5px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, marginLeft: '10px' }}>RECEIVED</div>}
          {!isReadOnly && (formData.status === 'Pending' || formData.status === 'Pending Dept Head Approval') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '0 16px', borderRadius: '12px', border: '1px solid #cbd5e1', height: '44px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company:</span>
                <select 
                  name="company" 
                  value={formData.company || ''} 
                  onChange={handleChange} 
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button className="action-btn-premium primary" onClick={handleSave} style={{ borderRadius: '16px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} />
                <span>Submit Request</span>
              </button>
            </>
          )}
          {isReviewMode && (formData.status === 'Pending Dept Head Approval' || formData.status === 'Pending Final Approval') && isOwner && (
            <button onClick={handleCancelRequest} className="tool-btn cancel" style={{ background: '#64748b', color: 'white', marginRight: '10px' }}>Cancel Request</button>
          )}
          {/* Status badges removed from toolbar for cleaner UI */}
        </div>
      </div>

      <div className="form-main-content">
        <div className="form-container">
          <div className="rfp-paper">
            <div className="rfp-header">
              <div className="rfp-logo-section">
                <img 
                  src={(() => {
                    const compName = formData?.company || formData?.author?.company || user?.company?.name;
                    const selected = companies.find(c => c.name === compName);
                    if (selected?.logoUrl) return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selected.logoUrl}`;
                    if (compName?.includes('Adventures')) return "/Adventures_Logo.png";
                    if (compName?.includes('Capital')) return "/CGI_Logo.png";
                    return "/HDI Primary Logo .png";
                  })()} 
                  alt="Company Logo" 
                  className="rfp-logo" 
                />
              </div>
              <div className="rfp-meta">
                <div className="rfp-meta-row">
                  <label>RFP No.</label>
                  <input name="rfpNo" value={formData.rfpNo} onChange={handleChange} disabled={isFieldDisabled('rfpNo', isReadOnly)} placeholder="AUTO" />
                </div>

                <div className="rfp-meta-row">
                  <label>Date Requested</label>
                  <input type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} disabled={isFieldDisabled('dateRequested', isReadOnly)} />
                </div>
                <div className="rfp-meta-row">
                  <label>Date Needed</label>
                  <input type="date" name="dateNeeded" value={formData.dateNeeded} onChange={handleChange} disabled={isFieldDisabled('dateNeeded', isReadOnly)} />
                </div>
                <div className="rfp-meta-row">
                  <label>Charge to</label>
                  <input name="chargeTo" value={formData.chargeTo} onChange={handleChange} disabled={isFieldDisabled('chargeTo', isReadOnly)} placeholder="Dept/Project" />
                </div>
              </div>
            </div>

            <h1 className="rfp-title">REQUEST FOR PAYMENT</h1>

            <div className="rfp-release-section">
              <span>Please release funds to:</span>
              <input name="releaseFundsTo" value={formData.releaseFundsTo} onChange={handleChange} disabled={isFieldDisabled('releaseFundsTo', isReadOnly)} style={{ flex: 1 }} placeholder="Payee Name" />
              <span>( P</span>
              <input name="amount" value={formData.amount} onChange={handleChange} disabled={isFieldDisabled('amount', isReadOnly)} style={{ width: '80px' }} placeholder="0.00" />
              <span>)</span>
            </div>

            <table className="rfp-table">
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>PURPOSE</th>
                  <th style={{ width: '30%' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <textarea name="purpose" value={formData.purpose} onChange={handleChange} disabled={isFieldDisabled('purpose', isReadOnly)} placeholder="Enter purpose/description..."></textarea>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <input name="amount" value={formData.amount} onChange={handleChange} disabled={isFieldDisabled('amount', isReadOnly)} placeholder="0.00" />
                  </td>
                </tr>
                <tr className="rfp-total-row">
                  <td>TOTAL</td>
                  <td>P {formData.amount ? parseFloat(formData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                </tr>
              </tbody>
            </table>

            <div className="rfp-footer-meta">
              <div className="rfp-footer-column">
                <div className="rfp-footer-row">
                  <label>P.O Number:</label>
                  <input name="poNumber" value={formData.poNumber} onChange={handleChange} disabled={isFieldDisabled('poNumber', isReadOnly)} placeholder="---" />
                </div>
                <div className="rfp-footer-row">
                  <label>S.I. Number:</label>
                  <input name="siNumber" value={formData.siNumber} onChange={handleChange} disabled={isFieldDisabled('siNumber', isReadOnly)} placeholder="---" />
                </div>
              </div>
            </div>

            <div className="rfp-signatures">
              <div className="rfp-sig-box">
                <div className="sig-name">{formData.requestor || ''}</div>
                <div className="rfp-sig-line"></div>
                <div className="sig-label">PREPARED BY</div>
              </div>
              <div className="rfp-sig-box">
                <div className="sig-name">{formData.deptHead || formData.approvedBy || ''}</div>
                <div className="rfp-sig-line"></div>
                <div className="sig-label">DEPT HEAD</div>
              </div>
              <div className="rfp-sig-box">
                <div className="sig-name">{formData.approvedBy || ''}</div>
                <div className="rfp-sig-line"></div>
                <div className="sig-label">APPROVED BY</div>
              </div>
              <div className="rfp-sig-box">
                <div className="sig-name">{formData.receivedBy || ''}</div>
                <div className="rfp-sig-line"></div>
                <div className="sig-label">ACCOUNTING</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReasonModal && (
        <div className="reason-modal-overlay">
          <div className="reason-modal glass">
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Disapproval Reason
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.2rem' }}>Please provide a reason for rejecting this request.</p>
            <textarea 
              value={disReason} 
              onChange={(e) => setDisReason(e.target.value)} 
              placeholder="Enter reason here..."
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                marginBottom: '1.5rem', 
                padding: '1.2rem', 
                borderRadius: '16px', 
                border: '1px solid var(--glass-border)', 
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '1rem',
                resize: 'none',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="tool-btn"
                onClick={confirmDisapprove} 
                disabled={!disReason.trim()}
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: disReason.trim() ? '#ef4444' : '#666', color: 'white', border: 'none', fontWeight: 700, cursor: disReason.trim() ? 'pointer' : 'not-allowed' }}
              >
                Confirm Disapprove
              </button>
              <button 
                className="tool-btn"
                onClick={() => setShowReasonModal(false)} 
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
