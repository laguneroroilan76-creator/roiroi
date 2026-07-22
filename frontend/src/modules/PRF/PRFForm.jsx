import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
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
  const canApprovePRF = user?.role === 'Admin' || user?.departmentRole === 'President' || user?.departmentRole === 'DepartmentHead';
  const isGuard = user?.role === 'Guard';
  
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [disReason, setDisReason] = useState('');
  const [companies, setCompanies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultFormData = () => {
    const today = new Date().toISOString().split('T')[0];
    const base = {
      prfNo: '',
      dateRequested: today,
      dateNeeded: '',
      requestor: user?.name || '',
      to: '',
      from: '',
      department: '',
      company: user?.company?.name || '',
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
      return { ...base, ...stateInitialData, dateRequested: stateInitialData.dateRequested || today, preparedBy: stateInitialData.preparedBy?.name || stateInitialData.preparedBy || stateInitialData.author?.name || base.preparedBy, verifiedBy: stateInitialData.verifiedBy?.name || stateInitialData.verifiedBy || base.verifiedBy, approvedBy: stateInitialData.approvedBy?.name || stateInitialData.approvedBy || base.approvedBy, items: mergedItems };
    }
    return base;
  };

  const [formData, setFormData] = useState(getDefaultFormData());

  useEffect(() => {
    setFormData(getDefaultFormData());
    setStatus(location.state?.initialData?.status || 'Pending');
    api.get('/companies').then(res => setCompanies(res.data)).catch(console.error);
  }, [location.state]);

  const isFieldDisabled = (fieldName, baseDisabled = false) => {
    // Date Requested is always read-only
    if (fieldName === 'dateRequested') return true;
    
    if (!initialData) return false;
    // Signature fields should always be locked for non-authorities
    if (fieldName === 'verifiedBy' || fieldName === 'approvedBy') {
      if (status === 'Pending Verification' && fieldName === 'verifiedBy') return !(user?.role === 'Admin' || user?.canApprove || user?.canVerify);
      if (status === 'Pending Approval' && fieldName === 'approvedBy') return !(user?.role === 'Admin' || user?.canApprove || user?.canApprovePRF || user?.role === 'Accounting');
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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const items = (formData?.items || []).filter(it => it?.particulars?.trim() !== '');
      const payload = { ...formData, items };
      delete payload.status;
      if (isReviewMode && initialData?.id) {
        await api.put(`/prfs/${initialData.id}`, payload);
        showToast('Purchase Requisition Updated!', 'success');
      } else {
        await api.post('/prfs', payload);
        showToast('Purchase Requisition Created!', 'success');
      }
      initialData ? navigate(-1) : navigate('/dashboard');
    } catch (err) { 
      const msg = err.response?.data?.error || err.message || 'Error saving Purchase Requisition';
      showToast(msg, 'error'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!await confirm('Verify this PRF?')) return;
    try {
      const items = (formData?.items || []).filter(it => it?.particulars?.trim() !== '');
      const payload = { 
        ...formData, 
        items 
      };
      await api.post(`/prfs/${initialData.id}/verify`, payload);
      showToast('Purchase Requisition Verified!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast('Error verifying PRF', 'error');
    }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this PRF?')) return;
    try {
      const items = (formData?.items || []).filter(it => it?.particulars?.trim() !== '');
      const payload = { 
        ...formData, 
        items 
      };
      await api.post(`/prfs/${initialData.id}/approve`, payload);
      showToast('Purchase Requisition Approved!', 'success');
      navigate('/pending');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Error saving PRF';
      showToast(msg, 'error');
    }
  };


  const confirmDisapprove = async () => {
    try {
      const payload = { ...formData, disapprovalReason: disReason, items: formData.items.filter(it => it.particulars.trim() !== '') };
      await api.post(`/prfs/${initialData.id}/reject`, payload);
      showToast('Disapproved', 'info');
      navigate('/pending');
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
      await api.post(`/prfs/${initialData.id}/cancel`);
      showToast('Request Cancelled', 'info');
      initialData ? navigate(-1) : navigate('/dashboard');
    } catch (err) { showToast('Error cancelling request', 'error'); }
  };

  const isOwner = initialData?.authorId === user?.id || initialData?.requestor === user?.name;

  return (
    <div className="custom-form-page">
      <div className="sticky-toolbar office-toolbar no-print">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => initialData ? navigate(-1) : navigate('/dashboard')}>Back</button>
        </div>
        <div className="tool-group">
          {!isGuard && status === 'Approved' && (
            <button className="tool-btn print-btn" onClick={() => window.print()} style={{ background: '#334155', color: 'white' }}>Print</button>
          )}
          {!isReviewMode && !isReadOnly && (
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
              <button className="action-btn-premium primary" onClick={handleSave} disabled={isSubmitting} style={{ borderRadius: '16px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                <PlusCircle size={20} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </>
          )}
          
          {isReviewMode && (
            <>
              {((status === 'Pending Verification' || status === 'Pending')) && (user?.role === 'Admin' || user?.canApprove || user?.canVerify) && (
                <>
                  <button className="tool-btn approve" onClick={handleVerify} style={{ background: '#2563eb', color: '#ffffff' }}>Verify</button>
                  <button className="tool-btn disapprove" onClick={() => setShowReasonModal(true)}>Disapprove</button>
                </>
              )}
              {(status === 'Pending Approval' || status === 'Verified') && (user?.role === 'Admin' || user?.canApprove || user?.canApprovePRF || user?.role === 'Accounting') && (
                <>
                  <button className="tool-btn approve" onClick={handleApprove}>Approve</button>
                  <button className="tool-btn disapprove" onClick={() => setShowReasonModal(true)}>Disapprove</button>
                </>
              )}
            </>
          )}

          {(status === 'Pending' || status === 'Pending Verification' || status === 'Pending Approval') && isReviewMode && isOwner && (
            <button className="tool-btn cancel" onClick={handleCancelRequest} style={{ marginRight: '10px' }}>Cancel Request</button>
          )}
          {status === 'Approved' && isAdmin && <button className="tool-btn archive-btn" onClick={handleArchive}>Archive</button>}
        </div>
      </div>

      <div className="form-container office-form-container">
        <div className="printable-form prf-form-theme">
          <FormHeader formData={formData} handleChange={handleChange} isFieldDisabled={isFieldDisabled} user={user} companies={companies} />
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

      
    </div>
  );
}
