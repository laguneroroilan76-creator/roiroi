import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function RRFForm() {
  const { showToast, confirm } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const isReadOnly = location.state?.readOnly;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'Admin' || user?.canApprove;
  
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [disReason, setDisReason] = useState('');

  const [formData, setFormData] = useState(() => {
    const base = {
      rrfNo: '',
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
        qty: '',
        unit: '',
        particulars: '',
        estimatedCost: '',
        availableStocks: ''
      }))
    };
    if (initialData) {
      const mergedItems = [...base.items];
      if (initialData.items) {
        initialData.items.forEach((item, idx) => {
          if (idx < 15) mergedItems[idx] = { ...item };
        });
      }
      return { ...base, ...initialData, items: mergedItems };
    }
    return base;
  });

  const isFieldDisabled = (fieldName, baseDisabled = false) => {
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
      const payload = {
        ...formData,
        status: 'Pending',
        items: formData.items.filter(it => it.particulars.trim() !== '')
      };

      if (isReviewMode && initialData?.id) {
        await api.put(`/rrfs/${initialData.id}`, payload);
        showToast('Purchase Requisition Updated!', 'success');
      } else {
        await api.post('/rrfs', payload);
        showToast('Purchase Requisition Created!', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Error saving Purchase Requisition', 'error');
    }
  };

  const handleApprove = async () => {
    const confirmed = await confirm('Are you sure you want to approve this Purchase Requisition (PRF)?');
    if (!confirmed) return;
    try {
      const payload = { 
        ...formData, 
        status: 'Approved', 
        approvedBy: user.name,
        items: formData.items.filter(it => it.particulars.trim() !== '')
      };
      await api.put(`/rrfs/${initialData.id}`, payload);
      showToast('Purchase Requisition Approved!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Error approving Purchase Requisition', 'error');
    }
  };

  const handleDisapprove = () => setShowReasonModal(true);

  const confirmDisapprove = async () => {
    const confirmed = await confirm('Are you sure you want to disapprove this Purchase Requisition?');
    if (!confirmed) return;
    try {
      const payload = { 
        ...formData, 
        status: 'Disapproved', 
        disapprovalReason: disReason,
        items: formData.items.filter(it => it.particulars.trim() !== '')
      };
      await api.put(`/rrfs/${initialData.id}`, payload);
      showToast('Purchase Requisition Disapproved', 'info');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      showToast('Error disapproving Purchase Requisition', 'error');
    }
  };

  const handleArchive = async () => {
    const confirmed = await confirm('Are you sure you want to archive this record?');
    if (!confirmed) return;
    try {
      await api.put(`/rrfs/${initialData.id}`, { ...formData, status: 'Archived' });
      showToast('Record Archived', 'success');
      navigate('/archived');
    } catch (err) {
      showToast('Error archiving record', 'error');
    }
  };

  return (
    <div className="custom-form-page">
      <div className="sticky-toolbar glass no-print">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        
        <div className="tool-group">
          {!isReviewMode && (
            <button className="tool-btn save" onClick={handleSave}>
              💾 Submit Request
            </button>
          )}
          {status === 'Pending' && isReviewMode && isAdmin && (
            <>
              <button className="tool-btn approve" onClick={handleApprove}>
                ✅ Approve
              </button>
              <button className="tool-btn disapprove" onClick={handleDisapprove}>
                ❌ Disapprove
              </button>
            </>
          )}
          {status === 'Approved' && isAdmin && (
            <button className="tool-btn archive-btn" onClick={handleArchive}>
              📥 Archive
            </button>
          )}
          <button className="tool-btn print-btn" onClick={() => window.print()}>
            🖨️ Print Form
          </button>
        </div>
      </div>

      <div className="form-container glass">
        <div className="printable-form prf-form-theme">
          {/* Header */}
          <div className="form-header">
            <div className="header-main">
              <img src="/HDI Primary Logo .png" alt="HDI Logo" className="form-logo" />
              <div className="company-info">
                <h1>PURCHASE REQUISITION FORM</h1>
              </div>
            </div>
            <div className="header-meta">
              <div className="meta-row">
                <label>PRF No.:</label>
                <input type="text" name="rrfNo" value={formData.rrfNo} onChange={handleChange} disabled={isFieldDisabled('rrfNo')} placeholder="AUTO" />
              </div>
              <div className="meta-row">
                <label>Date Requested:</label>
                <input type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} disabled={isFieldDisabled('dateRequested')} />
              </div>
              <div className="meta-row">
                <label>Date Needed:</label>
                <input type="date" name="dateNeeded" value={formData.dateNeeded} onChange={handleChange} disabled={isFieldDisabled('dateNeeded')} />
              </div>
            </div>
          </div>

          <div className="form-section-row">
            <div className="form-group flex-1">
              <label>TO:</label>
              <input type="text" name="to" value={formData.to} onChange={handleChange} disabled={isFieldDisabled('to')} />
            </div>
            <div className="form-group flex-1">
              <label>FROM:</label>
              <input type="text" name="from" value={formData.from} onChange={handleChange} disabled={isFieldDisabled('from')} placeholder="Requester Name" />
            </div>
          </div>

          <div className="form-section-row" style={{ marginTop: '-0.5rem' }}>
            <div className="form-group flex-1">
              <label>DEPT:</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} disabled={isFieldDisabled('department')} placeholder="e.g. IT, Finance" />
            </div>
            <div className="form-group flex-1">
              <label>CO:</label>
              <input type="text" name="company" value={formData.company} onChange={handleChange} disabled={isFieldDisabled('company')} placeholder="e.g. HDI Adventures" />
            </div>
          </div>

          {/* Items Table */}
          <div className="items-table-container">
            <table className="prf-items-table">
              <thead>
                <tr>
                  <th width="5%">No.</th>
                  <th width="8%">Qty</th>
                  <th width="10%">Unit</th>
                  <th width="47%">Particulars / Purpose</th>
                  <th width="15%">Estimated Cost</th>
                  <th width="15%">Stock/s as of...</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <input 
                        type="text" 
                        value={item.qty} 
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} 
                        disabled={isFieldDisabled('items')}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={item.unit} 
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} 
                        disabled={isFieldDisabled('items')}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={item.particulars} 
                        onChange={(e) => handleItemChange(idx, 'particulars', e.target.value)} 
                        disabled={isFieldDisabled('items')}
                        placeholder={idx === 0 ? "Enter item description..." : ""}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={item.estimatedCost} 
                        onChange={(e) => handleItemChange(idx, 'estimatedCost', e.target.value)} 
                        disabled={isFieldDisabled('items')}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={item.availableStocks} 
                        onChange={(e) => handleItemChange(idx, 'availableStocks', e.target.value)} 
                        disabled={isFieldDisabled('items')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-section mt-4">
            <label>Remarks:</label>
            <textarea 
              name="remarks" 
              className="remarks-area"
              value={formData.remarks} 
              onChange={handleChange} 
              disabled={isFieldDisabled('remarks')}
              rows="4"
              placeholder="Additional instructions or notes..."
            ></textarea>
          </div>

          {/* Signatures */}
          <div className="form-signatures prf-sigs">
            <div className="sig-column">
              <div className="sig-box">
                <input type="text" name="preparedBy" value={formData.preparedBy} onChange={handleChange} disabled={isFieldDisabled('preparedBy')} />
                <label>Requested By</label>
              </div>
              <div className="sig-box">
                <input type="text" name="verifiedBy" value={formData.verifiedBy} onChange={handleChange} disabled={isFieldDisabled('verifiedBy')} />
                <label>Verified By</label>
              </div>
            </div>
            <div className="sig-column">
              <div className="sig-box">
                <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} disabled={isFieldDisabled('approvedBy')} />
                <label>Approved By</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3>Disapproval Reason</h3>
            <textarea 
              value={disReason} 
              onChange={(e) => setDisReason(e.target.value)}
              placeholder="Why is this being disapproved?"
              rows="5"
            ></textarea>
            <div className="modal-actions">
              <button className="tool-btn cancel" onClick={() => setShowReasonModal(false)}>Cancel</button>
              <button className="tool-btn disapprove" onClick={confirmDisapprove}>Confirm Disapprove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-form-page {
          background: var(--bg-gradient);
          min-height: 100vh;
          padding: 100px 20px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          color: var(--text-main);
        }
        .sticky-toolbar {
          position: fixed; top: 0; left: 280px; right: 0;
          padding: 1rem 3rem; display: flex; justify-content: space-between; align-items: center;
          z-index: 900; border-bottom: 1px solid var(--glass-border);
          box-shadow: 0 4px 30px rgba(0,0,0,0.03);
          transition: var(--transition-smooth);
        }
        .tool-group { display: flex; gap: 12px; align-items: center; }
        .tool-btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 700; transition: var(--transition-smooth); font-size: 0.95rem; }
        .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .tool-btn.back { background: var(--primary-light); color: var(--primary); }
        .tool-btn.save { background: var(--primary); color: white; }
        .tool-btn.approve { background: #10b981; color: white; }
        .tool-btn.disapprove { background: #ef4444; color: white; }
        .tool-btn.archive-btn { background: #f59e0b; color: white; }
        .tool-btn.print-btn { background: #334155; color: white; }

        .form-container {
          width: 100%;
          max-width: 1000px;
          background: var(--card-bg);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border: 1px solid var(--glass-border);
        }
        .form-logo {
          height: 50px;
          width: auto;
          object-fit: contain;
        }
        .header-main {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }
        .company-info h1 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--primary);
          letter-spacing: -0.5px;
        }
        .header-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .meta-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        .meta-row label {
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .meta-row input {
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 6px 10px;
          width: 130px;
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--primary);
          margin-bottom: 2rem;
        }
        .form-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .form-group label {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-dim);
          min-width: 60px;
          text-transform: uppercase;
        }
        .form-group input, .form-group textarea {
          flex: 1;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.95rem;
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
          transition: all 0.3s ease;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.05);
          outline: none;
        }
        .form-section {
          margin-top: 1.5rem;
        }
        .form-section label {
          display: block;
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 0.75rem;
          letter-spacing: 1px;
        }
        .remarks-area {
          width: 100%;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 14px;
          font-size: 0.95rem;
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
          transition: all 0.3s ease;
          resize: vertical;
          min-height: 100px;
        }
        .remarks-area:focus {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.05);
          outline: none;
        }
        .prf-form-theme {
          color: #334155;
          font-family: 'Inter', sans-serif;
        }
        .form-section-row {
          display: flex;
          gap: 2rem;
          margin: 1.5rem 0;
        }
        .flex-1 { flex: 1; }
        
        .items-table-container {
          margin: 1.5rem 0;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0,0,0,0.1);
        }
        .prf-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .prf-items-table th {
          background: rgba(0,0,0,0.2);
          padding: 12px;
          border-bottom: 1px solid var(--glass-border);
          border-right: 1px solid var(--glass-border);
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary);
          letter-spacing: 0.5px;
        }
        .prf-items-table td {
          padding: 0;
          border-bottom: 1px solid var(--glass-border);
          border-right: 1px solid var(--glass-border);
        }
        .prf-items-table input {
          width: 100%;
          border: none;
          padding: 6px 10px;
          background: transparent;
          font-size: 0.85rem;
          color: var(--text-main);
        }
        .prf-items-table input:focus {
          background: rgba(99, 102, 241, 0.05);
          outline: none;
        }
        .text-center { text-align: center; padding: 8px !important; }

        .prf-sigs {
          margin-top: 3rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }
        .sig-column {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .sig-box {
          border-bottom: 2px solid #334155;
          text-align: center;
          padding-bottom: 4px;
        }
        .sig-box input {
          width: 100%;
          border: none;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
          background: transparent;
          text-transform: uppercase;
        }
        .sig-box label {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          margin-top: 4px;
        }

        @media print {
          .printable-form {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .prf-items-table th { background: #eee !important; -webkit-print-color-adjust: exact; }
          .sig-box { border-bottom-color: #000 !important; }
        }
      `}</style>
    </div>
  );
}
