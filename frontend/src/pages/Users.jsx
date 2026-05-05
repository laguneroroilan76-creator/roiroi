import { useState, useEffect } from 'react';
import api, { BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';

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
    <div className="users-page">
      <div className="page-header">
        <div className="header-left">
          <h1>User Management</h1>
          <p className="subtitle">System Access & Permission Controls</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search by name, email, or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn add-user-btn" onClick={() => handleOpenModal()}>
            Add New User
          </button>
        </div>
      </div>

      <div className="table-container glass">
        <table className="users-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>System Role</th>
              <th>Email Address</th>
              <th>Access Rights</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <div className="user-cell">
                    <div className="user-avatar-box">
                      <div className="user-initial">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                        ) : (
                          user.name?.[0] || 'U'
                        )}
                      </div>
                    </div>
                    <span className="user-name">{user.name || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role?.toLowerCase()}`}>
                    {user.role || 'User'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{user.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {user.canApprove && <span className="approver-badge">Master</span>}
                    {user.canApproveTripTicket && <span className="approver-badge ticket">Trip</span>}
                    {user.canApprovePRF && <span className="approver-badge prf">PRF</span>}
                    {user.canApproveRFP && <span className="approver-badge rfp">RFP</span>}
                    {user.canApproveDeptHead && <span className="approver-badge dept">Dept</span>}
                    {user.canEndorse && <span className="approver-badge endorse">Endorse</span>}
                    {user.canVerify && <span className="approver-badge verify">Verify</span>}
                    {!user.canApprove && !user.canApproveTripTicket && !user.canApprovePRF && !user.canApproveRFP && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Standard Access</span>
                    )}
                  </div>
                </td>
                <td className="date-cell">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>
                  <div className="actions">
                    <button className="action-btn edit" title="Edit User" onClick={() => handleOpenModal(user)}>Edit</button>
                    <button className="action-btn delete" title="Delete User" onClick={() => handleDelete(user.id)}>Delete</button>
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
              <div className="title-area">
                <h2>{editingUser ? 'Update User Profile' : 'Register New User'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-sections">
                {/* Section 1: Basic Identity */}
                <div className="form-section">
                  <h3 className="section-label">Identity & Account Details</h3>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Full Name</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          placeholder="Corporate Email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="input-row">
                    <div className="input-group">
                      <label>{editingUser ? 'Change Password' : 'Initial Password'}</label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          placeholder={editingUser ? "Keep current password" : "Password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingUser}
                        />
                      </div>
                      <p className="input-hint">Minimum 8 characters, with uppercase and special characters.</p>
                    </div>
                    <div className="input-group">
                      <label>Primary System Role</label>
                      <div className="input-wrapper">
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
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Approvals (Only for Users) */}
                {formData.role === 'User' && (
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
                {formData.role === 'User' && (
                  <div className="form-section">
                    <h3 className="section-label">Module Access Permissions</h3>
                    <div className="module-perm-grid">
                      {[
                        { key: 'tripTicket', label: 'Trip Ticket' },
                        { key: 'prf', label: 'Purchase Request' },
                        { key: 'rrf', label: 'Payment Request' },
                        { key: 'vehicles', label: 'Fleet Management' },
                        { key: 'users', label: 'User Management' },
                        { key: 'history', label: 'System Logs' },
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
                            {['tripTicket', 'prf', 'rrf', 'vehicles', 'users'].includes(module.key) && (
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
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Save Profile Changes' : 'Complete Registration'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-page { padding: 2rem 3rem; max-width: 1400px; margin: 0 auto; color: var(--text-main); min-height: 100vh; }
        
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
        .header-left h1 { font-size: 2.8rem; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 4px; }
        .subtitle { color: var(--text-dim); font-weight: 500; font-size: 1.1rem; }
        
        .header-actions { display: flex; gap: 1.5rem; align-items: center; }
        .search-box { 
          display: flex; align-items: center; background: var(--card-bg); 
          padding: 0.8rem 1.5rem; border-radius: 18px; border: 1px solid var(--glass-border);
          box-shadow: 0 4px 15px rgba(0,0,0,0.02); min-width: 300px; transition: 0.3s;
        }
        .search-box:focus-within { border-color: var(--primary); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.1); transform: translateY(-2px); }
        .search-box span { margin-right: 12px; font-size: 1.1rem; opacity: 0.5; }
        .search-box input { border: none; background: none; outline: none; width: 100%; color: var(--text-main); font-weight: 600; font-size: 0.95rem; }

        .add-user-btn { 
          padding: 0.8rem 1.8rem; background: var(--primary); border-radius: 18px; 
          font-weight: 700; border: none; color: white; cursor: pointer;
          font-size: 0.95rem;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
        }
        .add-user-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); }

        .table-container { 
          border-radius: 30px; border: 1px solid var(--glass-border); 
          background: var(--card-bg); box-shadow: 0 20px 50px rgba(0,0,0,0.03); 
          overflow: hidden; animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .users-table th { 
          background: var(--primary-light); padding: 1.5rem 2rem; font-size: 0.8rem; 
          color: var(--primary); text-transform: uppercase; letter-spacing: 2px; 
          font-weight: 800; border-bottom: 2px solid var(--glass-border); 
        }
        .users-table td { padding: 1.8rem 2rem; border-bottom: 1px solid var(--glass-border); vertical-align: middle; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: var(--primary-light); }

        .user-cell { display: flex; align-items: center; gap: 18px; }
        .user-avatar-box { position: relative; }
        .user-initial { 
          width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(135deg, var(--primary), #60a5fa);
          display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; font-weight: 800;
          box-shadow: 0 8px 15px rgba(37, 99, 235, 0.15);
        }
        .user-info-text { display: flex; flexDirection: column; gap: 2px; }
        .user-name { font-weight: 800; font-size: 1.05rem; color: var(--text-main); }
        .role-badge { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); }
        .role-badge.admin { color: #f59e0b; }
        .role-badge.accounting { color: #8b5cf6; }

        .date-cell { color: var(--text-dim); font-size: 0.9rem; font-weight: 600; }

        .actions { display: flex; gap: 10px; justify-content: flex-end; }
        .action-btn { 
          width: 44px; height: 44px; border-radius: 14px; border: 1px solid var(--glass-border); 
          background: var(--card-bg); color: var(--text-main); cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .action-btn:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }
        .action-btn.edit:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

        /* MODAL PREMIUM STYLES */
        .modal-overlay { 
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 2rem;
        }
        .modal-content.premium { 
          width: 100%; max-width: 850px; background: var(--card-bg); border-radius: 40px; 
          border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 50px 100px rgba(0,0,0,0.3);
          overflow: hidden; animation: modalPop 0.5s cubic-bezier(0.19, 1, 0.22, 1);
          max-height: 92vh; display: flex; flex-direction: column;
        }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .modal-header { 
          padding: 2.5rem 3rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid var(--glass-border); background: var(--primary-light);
        }
        .modal-header h2 { font-size: 1.8rem; font-weight: 800; letter-spacing: -1px; }
        .close-btn { 
          background: none; border: none; font-size: 2rem; color: var(--text-dim); cursor: pointer; 
          transition: 0.3s; opacity: 0.5;
        }
        .close-btn:hover { opacity: 1; transform: rotate(90deg); color: #ef4444; }

        .premium-form { padding: 0; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .form-sections { padding: 2.5rem 3rem; overflow-y: auto; flex: 1; }
        
        .form-section { margin-bottom: 3rem; }
        .form-section:last-child { margin-bottom: 1rem; }
        .section-label { 
          font-size: 0.85rem; font-weight: 800; color: var(--primary); text-transform: uppercase; 
          letter-spacing: 2px; margin-bottom: 1.8rem; display: flex; align-items: center; gap: 10px;
        }
        .section-label::after { content: ''; height: 1px; flex: 1; background: var(--glass-border); }

        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.8rem; }
        .input-group label { display: block; margin-bottom: 10px; font-weight: 700; font-size: 0.9rem; color: var(--text-main); }
        .input-wrapper { display: flex; align-items: center; }
        .input-wrapper input, .input-wrapper select { 
          width: 100%; padding: 1.1rem 1.5rem; background: var(--primary-light); 
          border: 2px solid transparent; border-radius: 20px; font-size: 1rem; font-weight: 600;
          color: var(--text-main); transition: 0.3s;
        }
        .input-wrapper input:focus, .input-wrapper select:focus { 
          background: var(--card-bg); border-color: var(--primary); 
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.1); outline: none;
        }

        .highlight { background: var(--primary-light); padding: 2rem; border-radius: 28px; border: 1px solid var(--glass-border); }
        .section-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        
        .master-toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .toggle-slider { 
          width: 50px; height: 26px; background: #cbd5e1; border-radius: 100px; position: relative; transition: 0.3s;
        }
        .toggle-slider::after { 
          content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; 
          background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .master-toggle input:checked + .toggle-slider { background: var(--primary); }
        .master-toggle input:checked + .toggle-slider::after { transform: translateX(24px); }
        .toggle-text { font-weight: 800; font-size: 0.9rem; color: var(--primary); }
        .master-toggle input { display: none; }

        .permission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .perm-card { background: var(--card-bg); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--glass-border); }
        .perm-header { font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.2rem; }
        .perm-list { display: flex; flex-direction: column; gap: 12px; }

        .custom-check-item { display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; }
        .custom-check-item:hover { transform: translateX(5px); }
        .custom-check-item input { display: none; }
        .check-box { 
          width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--glass-border); 
          position: relative; transition: 0.3s;
        }
        .custom-check-item input:checked + .check-box { background: var(--primary); border-color: var(--primary); }
        .custom-check-item input:checked + .check-box::after { 
          content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; 
          color: white; font-size: 0.8rem; font-weight: 900;
        }
        .check-text { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }

        .module-perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .module-item { 
          display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; 
          background: var(--primary-light); border-radius: 18px; border: 1px solid var(--glass-border);
        }
        .module-info { display: flex; align-items: center; }
        .module-name { font-weight: 700; font-size: 0.9rem; }
        
        .module-actions { display: flex; gap: 8px; }
        .chip-toggle input { display: none; }
        .chip { 
          padding: 6px 14px; border-radius: 10px; font-size: 0.7rem; font-weight: 800; 
          background: var(--card-bg); border: 1px solid var(--glass-border); color: var(--text-dim); transition: 0.3s;
        }
        .chip-toggle input:checked + .chip { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }

        .modal-footer { 
          padding: 2rem 3rem; background: var(--primary-light); display: flex; gap: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }
        .btn-secondary { 
          flex: 1; padding: 1.1rem; border-radius: 20px; border: 1px solid var(--glass-border);
          background: var(--card-bg); color: var(--text-dim); font-weight: 700; cursor: pointer; transition: 0.3s;
        }
        .btn-secondary:hover { background: #f1f5f9; color: var(--text-main); }
        .btn-primary { 
          flex: 2; padding: 1.1rem; border-radius: 20px; border: none;
          background: var(--primary); color: white; font-weight: 700; cursor: pointer; 
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2); transition: 0.3s;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(37, 99, 235, 0.3); }

        .approver-badge {
          background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 0.65rem;
          padding: 5px 12px; border-radius: 100px; font-weight: 900; border: 1px solid rgba(16, 185, 129, 0.1);
          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
        }
        .approver-badge.ticket { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .approver-badge.prf { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .approver-badge.rfp { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        /* DARK MODE */
        .dark-mode .search-box, .dark-mode .table-container, .dark-mode .modal-content.premium, .dark-mode .perm-card { background: #1e293b; }
        .dark-mode .users-table th { background: rgba(255,255,255,0.03); }
        .dark-mode .users-table tr:hover td { background: rgba(255,255,255,0.02); }
        .dark-mode .modal-header, .dark-mode .modal-footer, .dark-mode .highlight, .dark-mode .module-item { background: rgba(255,255,255,0.02); }
        .dark-mode .input-wrapper input, .dark-mode .input-wrapper select { 
          background: rgba(15, 23, 42, 0.6); 
          color: white; 
          border-color: rgba(255, 255, 255, 0.1); 
        }
        .dark-mode .input-wrapper input:focus, .dark-mode .input-wrapper select:focus { 
          border-color: var(--primary); 
          background: rgba(15, 23, 42, 0.8); 
        }
        .dark-mode select option {
          background: #1e293b;
          color: white;
        }
        .dark-mode .subtitle { color: #94a3b8; }
        .dark-mode .action-btn { background: rgba(255,255,255,0.05); color: #cbd5e1; border-color: rgba(255,255,255,0.1); }
        .dark-mode .action-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
