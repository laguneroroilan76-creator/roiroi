import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', canApprove: false, role: 'User', permissions: {} });
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
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
        role: user.role || 'User',
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || {})
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', canApprove: false, role: 'User', permissions: {} });
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
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      if (editingUser) {
        const res = await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, formData, config);
        showToast('User updated successfully', 'success');
        if (editingUser.id === currentUser?.id) {
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...res.data }));
            window.location.reload();
        }
      } else {
        await axios.post('http://localhost:5000/api/auth/register', formData, config);
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
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        <h1>👥 User Management</h1>
        <button className="btn add-user-btn" onClick={() => handleOpenModal()}>
          <span>+</span> Add New User
        </button>
      </div>

      <div className="table-container glass">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name & Role</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                    <div className="user-cell">
                        <div className="user-initial">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`} alt="" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px'}} />
                            ) : (
                                user.name?.[0] || 'U'
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800 }}>{user.name || 'N/A'}</span>
                            <span style={{ fontSize: '0.7rem', color: user.role === 'Admin' ? '#facc15' : user.role === 'Driver' ? '#3b82f6' : 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800 }}>
                                {user.role || 'User'}
                            </span>
                        </div>
                    </div>
                </td>
                <td>{user.email}</td>
                <td>
                    {user.canApprove && <span className="approver-badge">Approver</span>}
                </td>
                <td className="date-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    <button className="action-btn edit" onClick={() => handleOpenModal(user)}>✎</button>
                    <button className="action-btn delete" onClick={() => handleDelete(user.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>{editingUser ? 'New Password (Optional)' : 'Password'}</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
                <p className="input-hint">Requires 8+ chars, 1 Capital, 1 Special (!@#$)</p>
              </div>

              <div className="input-group">
                <label>System Role</label>
                <select 
                    className="role-select"
                    value={formData.role} 
                    onChange={(e) => {
                      const selectedRole = e.target.value;
                      setFormData({
                        ...formData,
                        role: selectedRole,
                        canApprove: ['Admin', 'Driver', 'Guard'].includes(selectedRole) ? false : formData.canApprove
                      });
                    }}
                >
                    <option value="User">Normal User</option>
                    <option value="Admin">System Admin</option>
                    <option value="Driver">Driver</option>
                    <option value="Guard">Guard</option>
                </select>
              </div>

              {formData.role === 'User' && (
                <>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={formData.canApprove}
                        onChange={(e) => setFormData({...formData, canApprove: e.target.checked})}
                      />
                      <span>Can Approve Forms</span>
                    </label>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="permissions-section" style={{ display: 'block', visibility: 'visible', opacity: 1, marginTop: '2rem' }}>
                    <h3 className="perm-title">Feature Access Controls</h3>
                    <div className="perm-grid">
                      {[
                        { key: 'tripTicket', label: 'Trip Ticket' },
                        { key: 'prf', label: 'PRF' },
                        { key: 'rrf', label: 'RRF' },
                        { key: 'vehicles', label: 'Vehicles' },
                        { key: 'users', label: 'User Mgt' },
                        { key: 'history', label: 'History' },
                        { key: 'archived', label: 'Archived' }
                      ].map(module => (
                        <div key={module.key} className="perm-item">
                          <span className="perm-label">{module.label}</span>
                          <div className="perm-options">
                            <label className="chip-check">
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
                              <label className="chip-check">
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
                                <span className="chip">Edit</span>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn submit">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-page { padding: 3rem; max-width: 1200px; margin: 0 auto; color: var(--text-main); }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
        
        .add-user-btn { width: auto; padding: 0.8rem 1.8rem; background: var(--primary); display: flex; align-items: center; gap: 10px; font-size: 0.95rem; margin-top: 0; border-radius: 16px; font-weight: 700; border: none; color: white; cursor: pointer; }
        .add-user-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .add-user-btn span { font-size: 1.4rem; line-height: 1; }

        .table-container { border-radius: 24px; overflow: hidden; border: 1px solid var(--glass-border); background: var(--card-bg); box-shadow: var(--card-shadow); }
        .users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .users-table th { background: var(--primary-light); padding: 1.5rem; font-size: 0.85rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; border-bottom: 2px solid var(--glass-border); }
        .users-table td { padding: 1.5rem; border-bottom: 1px solid var(--glass-border); vertical-align: middle; color: var(--text-main); font-weight: 500; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: var(--primary-light); }
        
        .user-cell { display: flex; align-items: center; gap: 15px; font-weight: 700; color: var(--text-main); }
        .user-initial { 
            width: 40px; height: 40px; border-radius: 12px; background: var(--primary); 
            display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; font-weight: 800;
        }

        .date-cell { color: var(--text-dim); font-size: 0.9rem; font-weight: 600; }

        .actions { display: flex; gap: 10px; justify-content: flex-end; }
        .action-btn { 
            width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--glass-border); 
            background: var(--card-bg); color: var(--text-main); cursor: pointer; transition: var(--transition-smooth);
            display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .action-btn:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .action-btn.edit:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

        .modal-overlay { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: center; z-index: 1100;
        }
        .modal-content { width: 100%; max-width: 650px; min-height: 500px; padding: 2rem; border-radius: 32px; background: var(--card-bg); border: 2px solid var(--primary); box-shadow: var(--premium-shadow); animation: modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); max-height: 90vh; overflow-y: auto; z-index: 10001; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .modal-content h2 { margin-bottom: 2.5rem; text-align: center; color: var(--text-main); font-size: 2rem; font-weight: 800; letter-spacing: -0.5px; }
        .modal-actions { display: flex; gap: 15px; margin-top: 3rem; }
        .btn.cancel { background: var(--primary-light); color: var(--primary); flex: 1; margin-top: 0; border: 1px solid var(--glass-border); cursor: pointer; border-radius: 12px; }
        .btn.cancel:hover { background: var(--primary); color: white; }
        .btn.submit { flex: 2; margin-top: 0; background: var(--primary); color: white; border: none; cursor: pointer; border-radius: 12px; }
        .btn.submit:hover { opacity: 0.9; }

        .approver-badge {
            background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 0.75rem;
            padding: 4px 12px; border-radius: 100px; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.2);
            text-transform: uppercase; letter-spacing: 0.5px;
        }

        .role-select {
            width: 100%; padding: 1rem 1.5rem; background: var(--card-bg); 
            border: 1px solid var(--glass-border); border-radius: 16px; color: var(--text-main); 
            font-size: 1rem; outline: none; appearance: none; font-weight: 600;
            transition: var(--transition-smooth);
            color-scheme: dark; /* Force browser to use dark dropdown UI if possible */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1.5rem center;
            background-size: 1.2rem;
        }
        .role-select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }
        .role-select option { background: #1e293b; color: white; padding: 10px; }
        
        .input-group { margin-bottom: 1.5rem; }
        .input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; color: var(--text-dim); }
        .input-group input { width: 100%; padding: 1rem 1.5rem; border: 1px solid var(--glass-border); border-radius: 16px; background: var(--card-bg); color: var(--text-main); font-size: 1rem; outline: none; transition: 0.3s; }
        .input-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }

        .checkbox-group { margin-top: 2rem; padding: 1.5rem; background: var(--primary-light); border-radius: 16px; border: 1px solid var(--glass-border); }
        .checkbox-label { 
            display: flex; align-items: center; gap: 12px; cursor: pointer; color: var(--text-main); font-size: 0.95rem; font-weight: 700;
        }
        .checkbox-label input[type="checkbox"] { width: 22px; height: 22px; accent-color: var(--primary); cursor: pointer; }
        .input-hint { font-size: 0.8rem; color: var(--text-dim); margin-top: 8px; font-weight: 500; }

        .dark-mode .users-table th { background: rgba(255,255,255,0.03); color: var(--text-dim); }
        .dark-mode .users-table tr:hover td { background: rgba(255,255,255,0.03); }
        .dark-mode .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }
         .permissions-section { margin-top: 2rem; padding: 1.5rem; background: var(--primary-light); border-radius: 20px; border: 1px solid var(--glass-border); }
        .perm-title { font-size: 0.9rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; }
        .perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .perm-item { display: flex; flex-direction: column; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .perm-label { font-size: 0.8rem; font-weight: 700; color: var(--text-main); }
        .perm-options { display: flex; gap: 8px; }
        
        .chip-check { cursor: pointer; }
        .chip-check input { display: none; }
        .chip { 
            padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; 
            background: var(--card-bg); border: 1px solid var(--glass-border); color: var(--text-dim);
            transition: all 0.2s;
        }
        .chip-check input:checked + .chip { 
            background: var(--primary); color: white; border-color: var(--primary); 
        }

        .dark-mode .permissions-section { background: rgba(255,255,255,0.02); }
        .dark-mode .perm-item { border-bottom-color: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
