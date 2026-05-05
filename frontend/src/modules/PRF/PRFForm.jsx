import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './PRFForm.css';

// Modular Sections
import {
  FormHeader,
  BasicInfo,
  ItemsTable,
  RemarksSection,
  SignatureSection
} from './PRFFormSections';

export default function PRFForm() {
  const { showToast, confirm } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const isReadOnly = location.state?.readOnly;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'Admin' || user?.canApprove;
  const canApprovePRF = user?.role === 'Admin' || user?.canApprove || user?.canApprovePRF;
  const isGuard = user?.role === 'Guard';
  
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [disReason, setDisReason] = useState('');

  const getDefaultFormData = () => {
    const base = {
      prfNo: '',
      dateRequested: new Date().toISOString().split('T')[0],
      dateNeeded: '',
      requestor: user?.name || '',
      to: '',
      from: '',
      department: '',
      company: '',
      remarks: '',
      preparedBy: user?.name || '',
      verifiedBy: '',
      approvedBy: '',
      items: Array(15).fill().map(() => ({
        qty: '', unit: '', particulars: '', estimatedCost: '', availableStocks: ''
      }))
    };
    const stateInitialData = location.state?.initialData;
    if (stateInitialData) {
      const mergedItems = [...base.items];
      if (stateInitialData.items) {
        stateInitialData.items.forEach((item, idx) => { if (idx < 15) mergedItems[idx] = { ...item }; });
      }
      return { ...base, ...stateInitialData, items: mergedItems };
    }
    return base;
  };

  const [formData, setFormData] = useState(getDefaultFormData());

  useEffect(() => {
    setFormData(getDefaultFormData());
    setStatus(location.state?.initialData?.status || 'Pending');
  }, [location.state]);

  const isFieldDisabled = (fieldName, baseDisabled = false) => {
    // Signature fields should always be locked for non-authorities
    if (fieldName === 'verifiedBy' || fieldName === 'approvedBy') {
      if (status === 'Pending' && isReviewMode) {
        if (fieldName === 'verifiedBy') return !(user?.role === 'Admin' || user?.canApprove || user?.canVerify);
        if (fieldName === 'approvedBy') return !(user?.role === 'Admin' || user?.canApprove);
      }
      return true;
    }

    if (status === 'Approved' || status === 'Archived' || status === 'Disapproved') return true;
    if (status === 'Pending' && isReviewMode) return true;
    return baseDisabled;
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = async () => {
    try {
      const items = (formData?.items || []).filter(it => it?.particulars?.trim() !== '');
      const payload = { ...formData, status: 'Pending', items };
      if (isReviewMode && initialData?.id) {
        await api.put(`/prfs/${initialData.id}`, payload);
        showToast('Purchase Requisition Updated!', 'success');
      } else {
        await api.post('/prfs', payload);
        showToast('Purchase Requisition Created!', 'success');
      }
      navigate('/dashboard');
    } catch (err) { 
      const msg = err.response?.data?.error || err.message || 'Error saving Purchase Requisition';
      showToast(msg, 'error'); 
    }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this PRF?')) return;
    try {
      const items = (formData?.items || []).filter(it => it?.particulars?.trim() !== '');
      const payload = { 
        ...formData, 
        status: 'Approved', 
        approvedBy: user.name || user.email || 'ADMIN', 
        items 
      };
      await api.put(`/prfs/${initialData.id}`, payload);
      showToast('Purchase Requisition Approved!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Error saving PRF';
      showToast(msg, 'error');
    }
  };


  const confirmDisapprove = async () => {
    if (!await confirm('Disapprove this PRF?')) return;
    try {
      const payload = { ...formData, status: 'Disapproved', disapprovalReason: disReason, items: formData.items.filter(it => it.particulars.trim() !== '') };
      await api.put(`/prfs/${initialData.id}`, payload);
      showToast('Disapproved', 'info');
      navigate('/archived');
    } catch (err) { showToast('Error disapproving', 'error'); }
  };

  const handleArchive = async () => {
    if (!await confirm('Archive this record?')) return;
    try {
      await api.put(`/prfs/${initialData.id}`, { ...formData, status: 'Archived' });
      showToast('Record Archived', 'success');
      navigate('/archived');
    } catch (err) { showToast('Error archiving', 'error'); }
  };

  const handleCancelRequest = async () => {
    if (!await confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.put(`/prfs/${initialData.id}`, { status: 'Cancelled' });
      showToast('Request Cancelled', 'info');
      navigate('/dashboard');
    } catch (err) { showToast('Error cancelling request', 'error'); }
  };

  const isOwner = initialData?.authorId === user?.id || initialData?.requestor === user?.name;

  return (
    <div className="custom-form-page">
      <div className="sticky-toolbar office-toolbar no-print">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate(-1)}>Back</button>
        </div>
        <div className="tool-group">
          {!isGuard && status === 'Approved' && (
            <button className="tool-btn print-btn" onClick={() => window.print()} style={{ background: '#334155', color: 'white' }}>Print</button>
          )}
          {!isReviewMode && !isReadOnly && <button className="tool-btn save" onClick={handleSave}>Submit Request</button>}
          {status === 'Pending' && isReviewMode && canApprovePRF && (
            <>
              <button className="tool-btn approve" onClick={handleApprove}>Approve</button>
              <button className="tool-btn disapprove" onClick={() => setShowReasonModal(true)}>Disapprove</button>
            </>
          )}
          {status === 'Pending' && isReviewMode && isOwner && (
            <button className="tool-btn cancel" onClick={handleCancelRequest} style={{ background: '#64748b', color: 'white', marginRight: '10px' }}>Cancel Request</button>
          )}
          {status === 'Approved' && isAdmin && <button className="tool-btn archive-btn" onClick={handleArchive}>Archive</button>}
        </div>
      </div>

      <div className="form-container office-form-container">
        <div className="printable-form prf-form-theme">
          <FormHeader formData={formData} handleChange={handleChange} isFieldDisabled={isFieldDisabled} />
          <BasicInfo formData={formData} handleChange={handleChange} isFieldDisabled={isFieldDisabled} />
          <ItemsTable formData={formData} handleItemChange={handleItemChange} isFieldDisabled={isFieldDisabled} />
          <RemarksSection formData={formData} handleChange={handleChange} isFieldDisabled={isFieldDisabled} />
          <SignatureSection formData={formData} handleChange={handleChange} isFieldDisabled={isFieldDisabled} />
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
                className="tool-btn disapprove"
                onClick={confirmDisapprove} 
                disabled={!disReason.trim()}
                style={{ flex: 1, background: disReason.trim() ? '#ef4444' : '#666' }}
              >
                Confirm Disapprove
              </button>
              <button 
                className="tool-btn cancel"
                onClick={() => setShowReasonModal(false)} 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-form-page { background: #ffffff; min-height: 100vh; padding: 100px 20px 60px; display: flex; flex-direction: column; align-items: center; font-family: 'Outfit', sans-serif; color: #1e293b; }
        .sticky-toolbar { position: fixed; top: 0; left: 280px; right: 0; padding: 1rem 3rem; display: flex; justify-content: space-between; align-items: center; z-index: 900; border-bottom: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .tool-group { display: flex; gap: 12px; align-items: center; }
        .tool-btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; transition: all 0.2s; font-size: 0.95rem; }
        .tool-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .tool-btn.back { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .tool-btn.save { background: var(--primary); color: white; }
        .tool-btn.approve { background: #10b981; color: white; }
        .tool-btn.disapprove { background: #ef4444; color: white; }
        .tool-btn.archive-btn { background: var(--primary); color: white; filter: brightness(1.1); }
        .tool-btn.print-btn { background: #334155; color: white; }
        .form-container { width: 100%; max-width: 1000px; background: #ffffff; border-radius: 12px; padding: 3rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
        .modal-content { width: 100%; max-width: 500px; padding: 2rem; border-radius: 24px; background: var(--card-bg); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border); }
        .modal-content h3 { margin-bottom: 1rem; color: var(--primary); }
        .modal-content textarea { width: 100%; padding: 1rem; border-radius: 12px; background: rgba(0,0,0,0.1); color: var(--text-main); border: 1px solid var(--glass-border); margin-bottom: 1.5rem; }
        .modal-actions { display: flex; gap: 1rem; }
        .tool-btn.cancel { background: rgba(0,0,0,0.05); color: var(--text-main); }
      `}</style>
    </div>
  );
}
