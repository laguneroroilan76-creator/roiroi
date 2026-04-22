import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', canApprove: false });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
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
      setFormData({ name: user.name || '', email: user.email, password: '', canApprove: user.canApprove || false });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', canApprove: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, formData);
        alert('User updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/register', formData);
        alert('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user');
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
              <th>Name</th>
              <th>Email</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                    <div className="user-cell">
                        <div className="user-initial">{user.name?.[0] || 'U'}</div>
                        <span>
                            {user.name || 'N/A'}
                            {user.canApprove && <span className="approver-badge">Approver</span>}
                        </span>
                    </div>
                </td>
                <td>{user.email}</td>
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
              </div>
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
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn submit">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-page { padding: 3rem; max-width: 1200px; margin: 0 auto; color: white; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.2rem; }
        
        .add-user-btn { width: auto; padding: 0.8rem 1.5rem; background: var(--primary); display: flex; align-items: center; gap: 8px; font-size: 0.95rem; margin-top: 0; }
        .add-user-btn span { font-size: 1.4rem; line-height: 1; }

        .table-container { border-radius: 20px; overflow: hidden; border: 1px solid var(--glass-border); }
        .users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .users-table th { background: rgba(255,255,255, 0.05); padding: 1.2rem; font-size: 0.85rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .users-table td { padding: 1.2rem; border-bottom: 1px solid var(--glass-border); vertical-align: middle; }
        .users-table tr:last-child td { border-bottom: none; }
        
        .user-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; }
        .user-initial { 
            width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.2); 
            display: flex; align-items: center; justify-content: center; color: #818cf8; font-size: 0.8rem;
        }

        .date-cell { color: var(--text-dim); font-size: 0.9rem; }

        .actions { display: flex; gap: 8px; justify-content: flex-end; }
        .action-btn { 
            width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--glass-border); 
            background: rgba(255,255,255, 0.03); color: white; cursor: pointer; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .action-btn:hover { background: rgba(255,255,255, 0.1); transform: translateY(-2px); }
        .action-btn.edit:hover { border-color: var(--primary); color: var(--primary); }
        .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; }

        /* Modal Styles */
        .modal-overlay { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; z-index: 1100;
        }
        .modal-content { width: 100%; max-width: 460px; padding: 2.5rem; border-radius: 24px; animation: modalIn 0.3s ease-out; }
        @keyframes modalIn { from { opacity: 0; scale: 0.9; } to { opacity: 1; scale: 1; } }

        .modal-content h2 { margin-bottom: 2rem; text-align: center; }
        .modal-actions { display: flex; gap: 12px; margin-top: 2.5rem; }
        .btn.cancel { background: rgba(255,255,255, 0.05); color: white; flex: 1; margin-top: 0; }
        .btn.cancel:hover { background: rgba(255,255,255, 0.1); }
        .btn.submit { flex: 2; margin-top: 0; }

        .empty-msg { padding: 4rem; text-align: center; color: var(--text-dim); }

        .approver-badge {
            background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 0.7rem;
            padding: 2px 8px; border-radius: 20px; margin-left: 10px; font-weight: 700;
        }

        .checkbox-group { margin-top: 1.5rem; }
        .checkbox-label { 
            display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-dim); font-size: 0.95rem;
        }
        .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; }
        .checkbox-label:hover { color: white; }
      `}</style>
    </div>
  );
}
