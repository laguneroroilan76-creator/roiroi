import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import './CompanyManagement.css';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', status: 'Active' });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const { showToast, confirm } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      showToast('Error loading companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (company = null) => {
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, status: company.status });
      setPreviewUrl(company.logoUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${company.logoUrl}` : null);
    } else {
      setEditingId(null);
      setFormData({ name: '', status: 'Active' });
      setPreviewUrl(null);
    }
    setLogoFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setLogoFile(null);
    setPreviewUrl(null);
    setFormData({ name: '', status: 'Active' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast('Company name is required', 'error');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('status', formData.status);
      if (logoFile) {
        data.append('logo', logoFile);
      }

      if (editingId) {
        await api.put(`/companies/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Company updated successfully', 'success');
      } else {
        await api.post('/companies', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Company added successfully', 'success');
      }
      
      handleCloseModal();
      fetchCompanies();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving company', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this company?')) return;
    try {
      await api.delete(`/companies/${id}`);
      showToast('Company deleted', 'success');
      fetchCompanies();
    } catch (err) {
      showToast('Error deleting company', 'error');
    }
  };

  return (
    <div className="company-management-page fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Company Management</h1>
            </div>
          </div>
        </div>
        <button className="action-btn-premium primary" onClick={() => handleOpenModal()} style={{ borderRadius: '16px', padding: '12px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <PlusCircle size={20} />
          Add Company
        </button>
      </header>

      <div className="table-container-glass">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>Loading companies...</div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>No companies found. Click "Add Company" to create one.</div>
        ) : (
          <table className="corporate-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                <th style={{ width: '40%' }}>Company</th>
                <th style={{ width: '20%' }}>Status</th>
                <th style={{ width: '25%' }}>Logo Preview</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr key={company.id}>
                  <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {index + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{company.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${company.status.toLowerCase()}`} style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: company.status === 'Active' ? '#15803d' : '#b91c1c', background: company.status === 'Active' ? '#dcfce7' : '#fee2e2' }}>
                      {company.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ width: '60px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {company.logoUrl ? (
                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${company.logoUrl}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No Logo</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                      <button className="action-btn-premium" onClick={() => handleOpenModal(company)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent', padding: '6px 12px', fontSize: '0.85rem' }}>Edit</button>
                      <button className="action-btn-premium" onClick={() => handleDelete(company.id)} style={{ background: '#fef2f2', color: '#ef4444', borderColor: 'transparent', padding: '6px 12px', fontSize: '0.85rem' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="cm-modal-overlay">
          <div className="cm-modal glass">
            <h2>{editingId ? 'Edit Company' : 'Add New Company'}</h2>
            <form onSubmit={handleSave}>
              <div className="cm-form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Adventures" 
                  autoFocus 
                  required 
                />
              </div>

              <div className="cm-form-group">
                <label>Company Logo</label>
                <div 
                  className="cm-logo-upload-box" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                  {previewUrl ? (
                    <div className="cm-preview-wrapper">
                      <img src={previewUrl} alt="Preview" className="cm-logo-preview" />
                      <div className="cm-upload-overlay">
                        <span>Click to change logo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="cm-upload-placeholder">
                      <ImageIcon size={48} />
                      <p>Click to upload logo</p>
                      <small>Max size: 5MB (PNG, JPG)</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="cm-modal-actions">
                <button type="button" className="cm-btn-cancel" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="cm-btn-save">
                  {editingId ? <CheckCircle size={18} /> : <PlusCircle size={18} />}
                  <span>{editingId ? 'Update' : 'Save'} Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
