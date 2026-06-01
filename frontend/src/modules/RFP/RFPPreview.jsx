import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './RFPForm.css';

export default function RFPPreview({ record, onClose, onActionComplete }) {
  const { showToast, confirm } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [disReason, setDisReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const formData = { ...record };

  const handleApprove = async () => {
    if (!await confirm('Approve this RFP?')) return;
    try {
      await api.post(`/rfps/${record.id}/approve`);
      showToast('RFP Approved!', 'success');
      onActionComplete();
    } catch (err) { showToast('Error approving', 'error'); }
  };

  const confirmDisapprove = async () => {
    try {
      await api.post(`/rfps/${record.id}/reject`, { disapprovalReason: disReason });
      showToast('RFP Disapproved', 'info');
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
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1e293b' }}>Review RFP</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Submitted on {new Date(record.createdAt).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleApprove} style={{ background: 'var(--primary)', color: '#ffffff' }}>Approve</button>
          <button onClick={() => setShowReasonModal(true)} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}>Disapprove</button>
          <button onClick={onClose} style={{ background: '#64748b', color: '#475569', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>

      <div className="form-container" style={{
        width: '100%', maxWidth: '1000px', background: 'white',
        padding: '3rem', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        border: '1px solid #e2e8f0'
      }}>
        <div className="rfp-paper">
          <div className="rfp-header">
            <div className="rfp-logo-section">
              <img 
                src={(formData?.company || formData?.author?.company || user?.company) === 'Adventures' ? "/Adventures_Logo.png" : (formData?.company || formData?.author?.company || user?.company) === 'Capital Growth' ? "/CGI_Logo.png" : "/HDI Primary Logo .png"} 
                alt="Company Logo" 
                className="rfp-logo" 
                style={{ height: '75px' }} 
              />
            </div>
            <div className="rfp-meta">
              <div className="rfp-meta-row">
                <label>RFP No.</label>
                <input value={formData.rrfNo || formData.rfpNo || 'AUTO'} disabled />
              </div>
              <div className="rfp-meta-row">
                <label>Date Requested</label>
                <input value={formData.dateRequested || ''} disabled />
              </div>
              <div className="rfp-meta-row">
                <label>Date Needed</label>
                <input value={formData.dateNeeded || ''} disabled />
              </div>
              <div className="rfp-meta-row">
                <label>Charge to</label>
                <input value={formData.chargeTo || formData.department || ''} disabled />
              </div>
            </div>
          </div>

          <h1 className="rfp-title" style={{ color: '#1e293b' }}>REQUEST FOR PAYMENT</h1>

          <div className="rfp-release-section">
            <span>Please release funds to:</span>
            <input value={formData.releaseFundsTo || ''} disabled style={{ flex: 1 }} />
            <span>( P</span>
            <input value={formData.amount || '0.00'} disabled style={{ width: '150px' }} />
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
                  <textarea value={formData.purpose || formData.remarks || ''} disabled style={{ minHeight: '120px' }} />
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <input value={formData.amount || '0.00'} disabled />
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
                <input value={formData.poNumber || '---'} disabled />
              </div>
              <div className="rfp-footer-row">
                <label>S.I. Number:</label>
                <input value={formData.siNumber || '---'} disabled />
              </div>
            </div>
          </div>

          <div className="rfp-signatures">
            <div className="rfp-sig-box">
              <div className="sig-name">{formData.requestor || formData.preparedBy || ''}</div>
              <div className="rfp-sig-line"></div>
              <div className="sig-label">PREPARED BY</div>
            </div>
            <div className="rfp-sig-box">
              <div className="sig-name"></div>
              <div className="rfp-sig-line"></div>
              <div className="sig-label">DEPT HEAD</div>
            </div>
            <div className="rfp-sig-box">
              <div className="sig-name">{formData.status !== 'Pending' ? (formData.approvedBy || '') : ''}</div>
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
              <button onClick={() => setShowReasonModal(false)} style={{ flex: 1, padding: '15px', background: '#64748b', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
