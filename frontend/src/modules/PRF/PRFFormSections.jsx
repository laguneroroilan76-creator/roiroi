import React from 'react';

export const FormHeader = ({ formData, handleChange, isFieldDisabled }) => (
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
        <input type="text" name="prfNo" value={formData.prfNo} onChange={handleChange} disabled={isFieldDisabled('prfNo')} placeholder={isFieldDisabled('prfNo') ? "" : "AUTO"} />
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
);

export const BasicInfo = ({ formData, handleChange, isFieldDisabled }) => (
  <>
    <div className="form-section-row">
      <div className="form-group flex-1">
        <label>TO:</label>
        <input type="text" name="to" value={formData.to} onChange={handleChange} disabled={isFieldDisabled('to')} />
      </div>
      <div className="form-group flex-1">
          <label>FROM:</label>
          <input type="text" name="from" value={formData.from} onChange={handleChange} disabled={isFieldDisabled('from')} placeholder={isFieldDisabled('from') ? "" : "Requester Name"} />
      </div>
    </div>

    <div className="form-section-row" style={{ marginTop: '-0.5rem' }}>
      <div className="form-group flex-1">
          <label>DEPT:</label>
          <input type="text" name="department" value={formData.department} onChange={handleChange} disabled={isFieldDisabled('department')} placeholder={isFieldDisabled('department') ? "" : "e.g. IT, Finance"} />
      </div>
      <div className="form-group flex-1">
          <label>CO:</label>
          <input type="text" name="company" value={formData.company} onChange={handleChange} disabled={isFieldDisabled('company')} placeholder={isFieldDisabled('company') ? "" : "e.g. HDI Adventures"} />
      </div>
    </div>
  </>
);

export const ItemsTable = ({ formData, handleItemChange, isFieldDisabled }) => (
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
                placeholder={isFieldDisabled('items') ? "" : (idx === 0 ? "Enter item description..." : "")}
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
);

export const RemarksSection = ({ formData, handleChange, isFieldDisabled }) => (
  <div className="form-section mt-4">
    <label>Remarks:</label>
    <textarea 
      name="remarks" 
      className="remarks-area"
      value={formData.remarks} 
      onChange={handleChange} 
      disabled={isFieldDisabled('remarks')}
      rows="4"
      placeholder={isFieldDisabled('remarks') ? "" : "Additional instructions or notes..."}
    ></textarea>
  </div>
);

export const SignatureSection = ({ formData, handleChange, isFieldDisabled }) => (
  <div className="prf-sigs">
    <div className="sig-column">
      <div className="sig-box">
        {isFieldDisabled('preparedBy') ? (
          <div className="sig-value-display">{formData.preparedBy}</div>
        ) : (
          <input type="text" name="preparedBy" value={formData.preparedBy} readOnly className="read-only-sig" />
        )}
      </div>
      <label className="sig-label">Requested By</label>
    </div>
    <div className="sig-column">
      <div className="sig-box">
        {isFieldDisabled('verifiedBy') ? (
          <div className="sig-value-display">{formData.verifiedBy}</div>
        ) : (
          <input type="text" name="verifiedBy" value={formData.verifiedBy} readOnly className="read-only-sig" />
        )}
      </div>
      <label className="sig-label">Verified By</label>
    </div>
    <div className="sig-column">
      <div className="sig-box">
        {isFieldDisabled('approvedBy') ? (
          <div className="sig-value-display">{formData.approvedBy}</div>
        ) : (
          <input type="text" name="approvedBy" value={formData.approvedBy} readOnly className="read-only-sig" />
        )}
      </div>
      <label className="sig-label">Approved By</label>
    </div>
  </div>
);
