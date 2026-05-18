import { useState, useEffect } from 'react';
import api, { BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search } from 'lucide-react';


export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', canApprove: false, canApprovePRF: false, canApproveTripTicket: false, canApproveRFP: false, canApproveDeptHead: false, canEndorse: false, canVerify: false, role: 'User', permissions: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load users. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        canApprove: user.canApprove || false,
        canApprovePRF: user.canApprovePRF || false,
        canApproveTripTicket: user.canApproveTripTicket || false,
        canApproveRFP: user.canApproveRFP || false,
        canApproveDeptHead: user.canApproveDeptHead || false,
        canEndorse: user.canEndorse || false,
        canVerify: user.canVerify || false,
        role: user.role || 'User',
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || {})
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', password: '',
        canApprove: false, canApprovePRF: false,
        canApproveTripTicket: false, canApproveRFP: false,
        canApproveDeptHead: false, canEndorse: false, canVerify: false,
        role: 'User', permissions: {}
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingUser && formData.role === 'Guard' && currentUser?.role !== 'Admin') {
      showToast('Only Admin users can create Guard accounts.', 'error');
      return;
    }

    try {
      if (editingUser) {
        const res = await api.put(`/users/${editingUser.id}`, formData);
        showToast('User updated successfully', 'success');
        if (editingUser.id === currentUser?.id) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, ...res.data }));
          window.location.reload();
        }
      } else {
        await api.post('/auth/register', formData);
        showToast('User created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving user', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      showToast('Error deleting user', 'error');
    }
  };

  if (loading) return <div className="users-page">Loading Users...</div>;

  return (
    <div className="users-page" style={{ padding: '2rem 3rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>User Management</h1>
            </div>
          </div>
        </div>
        <button className="action-btn-premium primary" onClick={() => handleOpenModal()} style={{ borderRadius: '16px', padding: '12px 24px' }}>
          Add New User
        </button>
      </header>

      <div className="toolbar-glass">
        <div className="search-box-premium">
          <Search size={18} className="search-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px' }}
          />
        </div>
      </div>

      <div className="table-container-glass">
        <table className="corporate-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Full Name</th>
              <th style={{ width: '15%' }}>System Role</th>
              <th style={{ width: '30%' }}>Email Address</th>
              <th style={{ width: '15%' }}>Created</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u =>
              u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.role?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(user => (
              <tr key={user.id}>
                <td>
                  <div className="cell-document">
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 8px 15px rgba(15, 23, 42, 0.15)', overflow: 'hidden' }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.name?.[0] || 'U'
                      )}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{user.name || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role?.toLowerCase()}`} style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: user.role === 'Admin' ? '#334155' : (user.role === 'Accounting' ? '#0f172a' : 'var(--text-dim)') }}>
                    {user.role || 'User'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{user.email}</td>
                <td style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                    <button className="action-btn-premium" onClick={() => handleOpenModal(user)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent' }}>Edit</button>
                    <button className="action-btn-premium" onClick={() => handleDelete(user.id)} style={{ background: '#fef2f2', color: '#ef4444', borderColor: 'transparent' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass premium">
            <div className="modal-header">
              <div className="modal-title">
                <h2>{editingUser ? 'Update User Profile' : 'Register New User'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-sections">
                {/* Section 1: Basic Identity */}
                <div className="form-section">
                  <h3 className="section-label">Identity & Account Details</h3>
                  <div className="grid-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="Corporate Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-row">
                    <div className="form-group">
                      <label>{editingUser ? 'Change Password' : 'Initial Password'}</label>
                      <input
                        type="password"
                        placeholder={editingUser ? "Keep current password" : "Password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                      <p className="input-hint" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Minimum 8 characters.</p>
                    </div>
                    <div className="form-group">
                      <label>Primary System Role</label>
                      <select

                          className="role-select"
                          value={formData.role}
                          onChange={(e) => {
                            const selectedRole = e.target.value;
                            setFormData({
                              ...formData,
                              role: selectedRole,
                              canApprove: ['Admin', 'Driver', 'Guard', 'Accounting'].includes(selectedRole) ? false : formData.canApprove
                            });
                          }}
                        >
                          <option value="User">Standard User</option>
                          <option value="Admin">Administrator</option>
                          <option value="Driver">Driver</option>
                          <option value="Guard">Security</option>
                          <option value="Accounting">Accounting</option>
                          <option value="IT">IT Specialist</option>
                        </select>
                      </div>
                  </div>
                </div>

                {/* Section 2: Approvals */}
                {(formData.role === 'User' || formData.role === 'Admin') && (
                  <div className="form-section highlight">
                    <div className="section-header-flex">
                      <h3 className="section-label">Approval Authorities</h3>
                      <label className="master-toggle">
                        <input
                          type="checkbox"
                          checked={formData.canApprove}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData,
                              canApprove: checked,
                              canApproveTripTicket: checked,
                              canApprovePRF: checked,
                              canApproveRFP: checked,
                              canApproveDeptHead: checked,
                              canEndorse: checked,
                              canVerify: checked
                            });
                          }}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">Enable All Authorities</span>
                      </label>
                    </div>

                    <div className="permission-grid">
                      <div className="perm-card">
                        <div className="perm-header">Main Approvals</div>
                        <div className="perm-list">
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canApproveTripTicket} onChange={(e) => setFormData({ ...formData, canApproveTripTicket: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Trip Tickets</span>
                          </label>
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canApprovePRF} onChange={(e) => setFormData({ ...formData, canApprovePRF: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Purchase (PRF)</span>
                          </label>
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canApproveRFP} onChange={(e) => setFormData({ ...formData, canApproveRFP: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Payment (RFP)</span>
                          </label>
                        </div>
                      </div>

                      <div className="perm-card">
                        <div className="perm-header">Special Signing</div>
                        <div className="perm-list">
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canApproveDeptHead} onChange={(e) => setFormData({ ...formData, canApproveDeptHead: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Dept Head</span>
                          </label>
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canEndorse} onChange={(e) => setFormData({ ...formData, canEndorse: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Endorser</span>
                          </label>
                          <label className="custom-check-item">
                            <input type="checkbox" checked={formData.canVerify} onChange={(e) => setFormData({ ...formData, canVerify: e.target.checked })} />
                            <span className="check-box"></span>
                            <span className="check-text">Verifier</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Feature Access Controls */}
                {(formData.role === 'User' || formData.role === 'Admin') && (
                  <div className="form-section">
                    <h3 className="section-label">Module Access Permissions</h3>
                    <div className="module-perm-grid">
                      {[
                        { key: 'tripTicket', label: 'Trip Ticket' },
                        { key: 'prf', label: 'Purchase Request' },
                        { key: 'rrf', label: 'Payment Request' },
                        { key: 'vehicles', label: 'Vehicle Access' },
                        { key: 'users', label: 'User Management' },
                        { key: 'history', label: 'Activity Log' },
                        { key: 'support', label: 'Support Log' },
                      ].map(module => (
                        <div key={module.key} className="module-item">
                          <div className="module-info">
                            <span className="module-name">{module.label}</span>
                          </div>
                          <div className="module-actions">
                            <label className="chip-toggle">
                              <input
                                type="checkbox"
                                checked={formData.permissions?.[module.key]?.view || false}
                                onChange={(e) => {
                                  const perms = { ...formData.permissions };
                                  if (!perms[module.key]) perms[module.key] = {};
                                  perms[module.key].view = e.target.checked;
                                  setFormData({ ...formData, permissions: perms });
                                }}
                              />
                              <span className="chip">View</span>
                            </label>
                            {['tripTicket', 'prf', 'rrf', 'vehicles', 'users', 'support'].includes(module.key) && (
                              <label className="chip-toggle">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions?.[module.key]?.edit || formData.permissions?.[module.key]?.manage || false}
                                  onChange={(e) => {
                                    const perms = { ...formData.permissions };
                                    if (!perms[module.key]) perms[module.key] = {};
                                    const key = module.key === 'users' || module.key === 'vehicles' ? 'manage' : 'edit';
                                    perms[module.key][key] = e.target.checked;
                                    setFormData({ ...formData, permissions: perms });
                                  }}
                                />
                                <span className="chip">Manage</span>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">{editingUser ? 'Save Profile Changes' : 'Complete Registration'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

