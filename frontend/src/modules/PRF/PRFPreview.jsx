import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FormHeader,
  BasicInfo,
  ItemsTable,
  RemarksSection,
  SignatureSection
} from './PRFFormSections';

export default function PRFPreview({ record, onClose, onActionComplete }) {
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [disReason, setDisReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [formData] = useState({ ...record });

  const handleApprove = async () => {
    if (!await confirm('Approve this PRF?')) return;
    try {
      await api.put(`${record.apiEndpoint}/${record.id}`, { status: 'Approved', approvedBy: user.name });
      showToast('PRF Approved!', 'success');
      onActionComplete();
    } catch (err) { showToast('Error approving', 'error'); }
  };

  const confirmDisapprove = async () => {
    try {
      await api.put(`${record.apiEndpoint}/${record.id}`, { status: 'Disapproved', disapprovalReason: disReason });
      showToast('PRF Disapproved', 'info');
      onActionComplete();
    } catch (err) { showToast('Error disapproving', 'error'); }
  };

  return (
    <div className="preview-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', zIndex: 10000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', overflowY: 'auto'
    }}>
      <div className="preview-toolbar" style={{
        width: '100%', maxWidth: '1000px', background: 'white',
        padding: '1.2rem 2.5rem', borderRadius: '20px', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        position: 'sticky', top: 0, zIndex: 11
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1e293b' }}>Review PRF</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Submitted on {new Date(record.createdAt).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleApprove} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Approve</button>
          <button onClick={() => setShowReasonModal(true)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Disapprove</button>
          <button onClick={onClose} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>

      <div className="form-container" style={{
        width: '100%', maxWidth: '1000px', background: 'white',
        padding: '3rem', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        border: '1px solid #e2e8f0'
      }}>
        <div className="printable-form prf-form-theme">
          <FormHeader formData={formData} handleChange={() => {}} isFieldDisabled={() => true} />
          <BasicInfo formData={formData} handleChange={() => {}} isFieldDisabled={() => true} />
          <ItemsTable formData={formData} handleItemChange={() => {}} isFieldDisabled={() => true} />
          <RemarksSection formData={formData} handleChange={() => {}} isFieldDisabled={() => true} />
          <SignatureSection formData={formData} handleChange={() => {}} isFieldDisabled={() => true} />
        </div>
      </div>

      {showReasonModal && (
        <div className="reason-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 11000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="reason-modal" style={{
              background: 'white', padding: '2.5rem', borderRadius: '24px',
              width: '100%', maxWidth: '500px', boxShadow: '0 30px 70px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>Disapproval Reason</h3>
            <textarea 
              value={disReason} 
              onChange={(e) => setDisReason(e.target.value)} 
              placeholder="Enter reason here..."
              style={{ width: '100%', minHeight: '150px', padding: '1.2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem', fontSize: '1rem', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              <button onClick={confirmDisapprove} disabled={!disReason.trim()} style={{ flex: 1, padding: '15px', background: disReason.trim() ? '#ef4444' : '#94a3b8', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Confirm</button>
              <button onClick={() => setShowReasonModal(false)} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .prf-form-theme input, .prf-form-theme textarea { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
        .prf-form-theme label { color: #64748b; font-weight: 700; }
        .sig-box { background: #f8fafc; border: 1px solid #e2e8f0; min-height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; text-transform: uppercase; }
      `}</style>
    </div>
  );
}
