import { useState, useEffect } from 'react';
import api, { BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search, X, User, Mail, Lock, Shield, ChevronDown,
  CheckSquare, Ticket, ShoppingCart, CreditCard, Car,
  Users as UsersIcon, History, HeadphonesIcon, UserCheck,
  ClipboardCheck, FileText, BadgeCheck, Star, Zap
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    canApprove: false, canApprovePRF: false,
    canApproveTripTicket: false, canApproveRFP: false,
    canApproveDeptHead: false, canEndorse: false, canVerify: false,
    role: 'User', permissions: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
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
        permissions: typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : (user.permissions || {})
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
      setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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

  // Count active permissions
  const activePermCount = [
    formData.canApprovePRF, formData.canApproveTripTicket,
    formData.canApproveRFP, formData.canApproveDeptHead, formData.canEndorse, formData.canVerify
  ].filter(Boolean).length;

  const roleDescriptions = {
    User: 'Standard employee with configurable approval authorities and module access.',
    Admin: 'Full system control. Can manage users, configurations, and all records.',
    Driver: 'Vehicle operator. Access limited to trip ticket submissions.',
    Guard: 'Security personnel. Access to vehicle gate logs and trip verification.',
    Accounting: 'Finance team member. Access to PRF, RFP, and payment workflows.',
    IT: 'IT Specialist. Extended system access for technical administration.',
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
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
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
            ).map((user, index) => (
              <tr key={user.id}>
                <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {index + 1}
                </td>
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

      {/* ── PREMIUM DARK MODAL ── */}
      {isModalOpen && (
        <div className="um-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="um-modal">

            {/* ── STICKY HEADER ── */}
            <div className="um-header">
              <div className="um-header-left">
                <div className="um-header-icon">
                  <Shield size={20} color="#3b82f6" />
                </div>
                <div>
                  <h2 className="um-title">
                    {editingUser ? 'Update User Profile' : 'Register New User'}
                  </h2>
                  <p className="um-subtitle">
                    Manage user identity, roles, and approval permissions.
                  </p>
                </div>
              </div>
              <button className="um-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <form onSubmit={handleSubmit} className="um-form">
              <div className="um-body">

                {/* SECTION 1 — Identity */}
                <div className="um-section-label">
                  <User size={13} />
                  Identity &amp; Account Details
                </div>

                <div className="um-grid-2">
                  <div className="um-field">
                    <label className="um-label">Full Name</label>
                    <div className="um-input-wrap">
                      <User size={15} className="um-input-icon" />
                      <input
                        className="um-input"
                        type="text"
                        placeholder="e.g. Juan dela Cruz"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="um-field">
                    <label className="um-label">Email Address</label>
                    <div className="um-input-wrap">
                      <Mail size={15} className="um-input-icon" />
                      <input
                        className="um-input"
                        type="email"
                        placeholder="corporate@hdi.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="um-grid-2">
                  <div className="um-field">
                    <label className="um-label">{editingUser ? 'Change Password' : 'Initial Password'}</label>
                    <div className="um-input-wrap">
                      <Lock size={15} className="um-input-icon" />
                      <input
                        className="um-input"
                        type="password"
                        placeholder={editingUser ? 'Leave blank to keep current' : 'Min. 8 characters'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </div>
                    <span className="um-hint">Min. 8 chars, 1 capital letter, and 1 special character.</span>
                  </div>
                  <div className="um-field">
                    <label className="um-label">Primary System Role</label>
                    <div className="um-select-wrap">
                      <select
                        className="um-select"
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
                      <ChevronDown size={15} className="um-select-arrow" />
                    </div>
                    {formData.role && (
                      <p className="um-role-desc">{roleDescriptions[formData.role]}</p>
                    )}
                  </div>
                </div>

                {/* SECTION 2 — Approvals */}
                {(formData.role === 'User' || formData.role === 'Admin') && (
                  <>
                    <div className="um-divider" />
                    <div className="um-section-row">
                      <div className="um-section-label" style={{ margin: 0 }}>
                        <BadgeCheck size={13} />
                        Approval Authorities
                        {activePermCount > 0 && (
                          <span className="um-perm-badge">{activePermCount} active</span>
                        )}
                      </div>
                      {/* Master toggle */}
                      <label className="um-master-toggle">
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
                        <span className={`um-toggle-track ${formData.canApprove ? 'active' : ''}`}>
                          <span className="um-toggle-thumb" />
                        </span>
                        <span className="um-toggle-label">Enable All</span>
                      </label>
                    </div>

                    <div className="um-perm-grid">
                      {/* Card 1 */}
                      <div className="um-perm-card">
                        <div className="um-perm-card-head">
                          <div className="um-perm-card-icon blue">
                            <ClipboardCheck size={14} />
                          </div>
                          <div>
                            <div className="um-perm-card-title">Main Approvals</div>
                            <div className="um-perm-card-desc">Core document sign-offs</div>
                          </div>
                        </div>
                        <div className="um-perm-items">
                          {[
                            { key: 'canApproveTripTicket', label: 'Trip Tickets', icon: <Ticket size={13}/> },
                            { key: 'canApprovePRF', label: 'Purchase (PRF)', icon: <ShoppingCart size={13}/> },
                            { key: 'canApproveRFP', label: 'Payment (RFP)', icon: <CreditCard size={13}/> },
                          ].map(({ key, label, icon }) => (
                            <label key={key} className="um-perm-item">
                              <span className="um-perm-item-left">
                                <span className="um-perm-item-icon">{icon}</span>
                                <span className="um-perm-item-text">{label}</span>
                              </span>
                              <div className="um-checkbox-wrap">
                                <input
                                  type="checkbox"
                                  checked={formData[key]}
                                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                />
                                <span className={`um-checkbox ${formData[key] ? 'checked' : ''}`}>
                                  {formData[key] && <span className="um-check-mark">✓</span>}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="um-perm-card">
                        <div className="um-perm-card-head">
                          <div className="um-perm-card-icon violet">
                            <Star size={14} />
                          </div>
                          <div>
                            <div className="um-perm-card-title">Special Signing</div>
                            <div className="um-perm-card-desc">Elevated signing privileges</div>
                          </div>
                        </div>
                        <div className="um-perm-items">
                          {[
                            { key: 'canApproveDeptHead', label: 'Dept Head', icon: <UserCheck size={13}/> },
                            { key: 'canEndorse', label: 'Endorser', icon: <FileText size={13}/> },
                            { key: 'canVerify', label: 'Verifier', icon: <CheckSquare size={13}/> },
                          ].map(({ key, label, icon }) => (
                            <label key={key} className="um-perm-item">
                              <span className="um-perm-item-left">
                                <span className="um-perm-item-icon">{icon}</span>
                                <span className="um-perm-item-text">{label}</span>
                              </span>
                              <div className="um-checkbox-wrap">
                                <input
                                  type="checkbox"
                                  checked={formData[key]}
                                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                />
                                <span className={`um-checkbox ${formData[key] ? 'checked' : ''}`}>
                                  {formData[key] && <span className="um-check-mark">✓</span>}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SECTION 3 — Module Access */}
                {(formData.role === 'User' || formData.role === 'Admin') && (
                  <>
                    <div className="um-divider" />
                    <div className="um-section-label">
                      <Zap size={13} />
                      Module Access Permissions
                    </div>
                    <div className="um-module-grid">
                      {[
                        { key: 'tripTicket', label: 'Trip Ticket', icon: <Ticket size={15}/> },
                        { key: 'prf', label: 'Purchase Request', icon: <ShoppingCart size={15}/> },
                        { key: 'rrf', label: 'Payment Request', icon: <CreditCard size={15}/> },
                        { key: 'vehicles', label: 'Vehicle Access', icon: <Car size={15}/> },
                        { key: 'users', label: 'User Management', icon: <UsersIcon size={15}/> },
                        { key: 'history', label: 'Activity Log', icon: <History size={15}/> }
                      ].map(module => (
                        <div key={module.key} className="um-module-item">
                          <div className="um-module-left">
                            <span className="um-module-icon">{module.icon}</span>
                            <span className="um-module-name">{module.label}</span>
                          </div>
                          <div className="um-module-chips">
                            <label className="um-chip-label">
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
                              <span className={`um-chip ${formData.permissions?.[module.key]?.view ? 'active' : ''}`}>View</span>
                            </label>
                            {['tripTicket', 'prf', 'rrf', 'vehicles', 'users'].includes(module.key) && (
                              <label className="um-chip-label">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions?.[module.key]?.edit || formData.permissions?.[module.key]?.manage || false}
                                  onChange={(e) => {
                                    const perms = { ...formData.permissions };
                                    if (!perms[module.key]) perms[module.key] = {};
                                    const k = module.key === 'users' || module.key === 'vehicles' ? 'manage' : 'edit';
                                    perms[module.key][k] = e.target.checked;
                                    setFormData({ ...formData, permissions: perms });
                                  }}
                                />
                                <span className={`um-chip ${(formData.permissions?.[module.key]?.edit || formData.permissions?.[module.key]?.manage) ? 'active' : ''}`}>Manage</span>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── STICKY FOOTER ── */}
              <div className="um-footer">
                <button type="button" className="um-btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="um-btn-save" disabled={isSaving}>
                  {isSaving ? (
                    <span className="um-loading-dots">
                      <span /><span /><span />
                    </span>
                  ) : (
                    editingUser ? 'Save Profile Changes' : 'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          </div>

          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            /* ══════════════════════════════════════════
               ANIMATIONS (shared)
            ══════════════════════════════════════════ */
            @keyframes umFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes umPop {
              from { opacity: 0; transform: scale(0.94) translateY(24px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes umDotPulse {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40%           { transform: scale(1);   opacity: 1; }
            }

            /* ══════════════════════════════════════════
               LIGHT MODE (default)
            ══════════════════════════════════════════ */

            /* ── OVERLAY ── */
            .um-overlay {
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.45);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10000;
              padding: 1.5rem;
              animation: umFadeIn 0.25s ease-out;
            }

            /* ── MODAL SHELL ── */
            .um-modal {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 24px;
              width: 100%;
              max-width: 760px;
              max-height: 90vh;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
              animation: umPop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* ── HEADER ── */
            .um-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 1.75rem 2rem 1.5rem;
              border-bottom: 1px solid #f1f5f9;
              background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(255,255,255,0) 60%);
              flex-shrink: 0;
            }
            .um-header-left {
              display: flex;
              align-items: center;
              gap: 1rem;
            }
            .um-header-icon {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: rgba(59,130,246,0.08);
              border: 1px solid rgba(59,130,246,0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .um-title {
              font-size: 1.35rem;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 2px;
              letter-spacing: -0.03em;
            }
            .um-subtitle {
              font-size: 0.8rem;
              color: #94a3b8;
              margin: 0;
              font-weight: 500;
            }
            .um-close-btn {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              color: #64748b;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              flex-shrink: 0;
            }
            .um-close-btn:hover {
              background: #fee2e2;
              border-color: #fca5a5;
              color: #ef4444;
            }

            /* ── FORM ── */
            .um-form {
              display: flex;
              flex-direction: column;
              flex: 1;
              min-height: 0;
            }

            /* ── BODY ── */
            .um-body {
              flex: 1;
              overflow-y: auto;
              padding: 1.75rem 2rem;
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
              scrollbar-width: thin;
              scrollbar-color: #e2e8f0 transparent;
            }
            .um-body::-webkit-scrollbar { width: 4px; }
            .um-body::-webkit-scrollbar-track { background: transparent; }
            .um-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

            /* ── SECTION LABEL ── */
            .um-section-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.68rem;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #3b82f6;
              margin-bottom: 0.25rem;
            }
            .um-section-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .um-perm-badge {
              background: rgba(59,130,246,0.08);
              color: #2563eb;
              border: 1px solid rgba(59,130,246,0.2);
              border-radius: 20px;
              padding: 1px 8px;
              font-size: 0.68rem;
              font-weight: 700;
              text-transform: none;
              letter-spacing: 0;
              margin-left: 6px;
            }
            .um-divider {
              height: 1px;
              background: #f1f5f9;
              margin: 0.25rem 0;
            }

            /* ── GRID LAYOUTS ── */
            .um-grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }
            @media (max-width: 580px) {
              .um-grid-2 { grid-template-columns: 1fr; }
            }

            /* ── FIELDS ── */
            .um-field {
              display: flex;
              flex-direction: column;
              gap: 0.45rem;
            }
            .um-label {
              font-size: 0.72rem;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
            .um-hint {
              font-size: 0.7rem;
              color: #94a3b8;
              font-weight: 500;
            }
            .um-role-desc {
              font-size: 0.72rem;
              color: #94a3b8;
              margin: 0;
              line-height: 1.5;
              font-weight: 500;
            }

            /* ── INPUTS ── */
            .um-input-wrap {
              position: relative;
              display: flex;
              align-items: center;
            }
            .um-input-icon {
              position: absolute;
              left: 14px;
              color: #94a3b8;
              pointer-events: none;
              flex-shrink: 0;
            }
            .um-input {
              width: 100%;
              padding: 12px 14px 12px 40px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              color: #0f172a;
              font-size: 0.9rem;
              font-weight: 500;
              font-family: 'Inter', sans-serif;
              outline: none;
              transition: all 0.2s ease;
              box-sizing: border-box;
            }
            .um-input::placeholder { color: #cbd5e1; }
            .um-input:hover { border-color: #cbd5e1; background: #f1f5f9; }
            .um-input:focus {
              border-color: #3b82f6;
              background: #fff;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
            }

            /* ── SELECT ── */
            .um-select-wrap { position: relative; }
            .um-select {
              width: 100%;
              padding: 12px 40px 12px 14px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              color: #0f172a;
              font-size: 0.9rem;
              font-weight: 500;
              font-family: 'Inter', sans-serif;
              outline: none;
              appearance: none;
              cursor: pointer;
              transition: all 0.2s ease;
              box-sizing: border-box;
            }
            .um-select:hover { border-color: #cbd5e1; background: #f1f5f9; }
            .um-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: #fff; }
            .um-select option { background: #fff; color: #0f172a; }
            .um-select-arrow {
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              color: #94a3b8;
              pointer-events: none;
            }

            /* ── MASTER TOGGLE ── */
            .um-master-toggle {
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              user-select: none;
            }
            .um-master-toggle input { display: none; }
            .um-toggle-track {
              width: 44px;
              height: 24px;
              background: #e2e8f0;
              border: 1px solid #cbd5e1;
              border-radius: 100px;
              position: relative;
              transition: all 0.3s ease;
              flex-shrink: 0;
            }
            .um-toggle-track.active {
              background: #3b82f6;
              border-color: #3b82f6;
              box-shadow: 0 0 10px rgba(59,130,246,0.3);
            }
            .um-toggle-thumb {
              position: absolute;
              top: 3px;
              left: 3px;
              width: 16px;
              height: 16px;
              background: #fff;
              border-radius: 50%;
              transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
              box-shadow: 0 1px 4px rgba(0,0,0,0.15);
            }
            .um-toggle-track.active .um-toggle-thumb { left: 23px; }
            .um-toggle-label {
              font-size: 0.8rem;
              font-weight: 700;
              color: #64748b;
            }

            /* ── PERMISSION CARDS ── */
            .um-perm-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }
            @media (max-width: 580px) {
              .um-perm-grid { grid-template-columns: 1fr; }
            }
            .um-perm-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 1.1rem;
              transition: all 0.2s ease;
            }
            .um-perm-card:hover {
              border-color: rgba(59,130,246,0.25);
              box-shadow: 0 4px 16px rgba(59,130,246,0.06);
              transform: translateY(-1px);
            }
            .um-perm-card-head {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              margin-bottom: 1rem;
              padding-bottom: 0.85rem;
              border-bottom: 1px solid #e2e8f0;
            }
            .um-perm-card-icon {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .um-perm-card-icon.blue {
              background: rgba(59,130,246,0.1);
              color: #3b82f6;
              border: 1px solid rgba(59,130,246,0.15);
            }
            .um-perm-card-icon.violet {
              background: rgba(139,92,246,0.1);
              color: #8b5cf6;
              border: 1px solid rgba(139,92,246,0.15);
            }
            .um-perm-card-title {
              font-size: 0.85rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .um-perm-card-desc {
              font-size: 0.7rem;
              color: #94a3b8;
              font-weight: 500;
            }
            .um-perm-items {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .um-perm-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 9px 10px;
              border-radius: 10px;
              cursor: pointer;
              transition: background 0.15s ease;
              border: 1px solid transparent;
            }
            .um-perm-item:hover {
              background: #f1f5f9;
              border-color: #e2e8f0;
            }
            .um-perm-item-left {
              display: flex;
              align-items: center;
              gap: 9px;
            }
            .um-perm-item-icon { color: #94a3b8; display: flex; align-items: center; }
            .um-perm-item-text {
              font-size: 0.85rem;
              font-weight: 600;
              color: #64748b;
              transition: color 0.15s;
            }
            .um-perm-item:hover .um-perm-item-text { color: #0f172a; }

            /* ── CUSTOM CHECKBOX ── */
            .um-checkbox-wrap input { display: none; }
            .um-checkbox {
              width: 20px;
              height: 20px;
              border-radius: 6px;
              border: 1.5px solid #cbd5e1;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              flex-shrink: 0;
            }
            .um-checkbox.checked {
              background: #3b82f6;
              border-color: #3b82f6;
              box-shadow: 0 0 8px rgba(59,130,246,0.25);
            }
            .um-check-mark {
              color: white;
              font-size: 11px;
              font-weight: 900;
              line-height: 1;
            }

            /* ── MODULE ACCESS GRID ── */
            .um-module-grid {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .um-module-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 11px 14px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              transition: all 0.2s ease;
            }
            .um-module-item:hover {
              background: #f1f5f9;
              border-color: rgba(59,130,246,0.2);
              transform: translateX(3px);
            }
            .um-module-left { display: flex; align-items: center; gap: 10px; }
            .um-module-icon { color: #94a3b8; display: flex; align-items: center; }
            .um-module-name { font-size: 0.875rem; font-weight: 700; color: #64748b; }
            .um-module-chips { display: flex; gap: 6px; }

            .um-chip-label { cursor: pointer; }
            .um-chip-label input { display: none; }
            .um-chip {
              display: inline-block;
              padding: 5px 14px;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 100px;
              font-size: 0.7rem;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              transition: all 0.2s ease;
              user-select: none;
            }
            .um-chip.active {
              background: rgba(59,130,246,0.08);
              border-color: rgba(59,130,246,0.25);
              color: #2563eb;
            }
            .um-chip-label:hover .um-chip:not(.active) {
              background: #f1f5f9;
              color: #64748b;
              border-color: #cbd5e1;
            }

            /* ── STICKY FOOTER ── */
            .um-footer {
              display: flex;
              gap: 0.75rem;
              padding: 1.25rem 2rem;
              border-top: 1px solid #f1f5f9;
              background: #fafafa;
              flex-shrink: 0;
            }
            .um-btn-cancel {
              flex: 1;
              height: 52px;
              border-radius: 14px;
              background: #fff;
              border: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 0.9rem;
              font-weight: 700;
              font-family: 'Inter', sans-serif;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .um-btn-cancel:hover {
              background: #f1f5f9;
              border-color: #cbd5e1;
              color: #0f172a;
            }
            .um-btn-save {
              flex: 2;
              height: 52px;
              border-radius: 14px;
              background: #3b82f6;
              border: none;
              color: white;
              font-size: 0.95rem;
              font-weight: 800;
              font-family: 'Inter', sans-serif;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(59,130,246,0.3);
              transition: all 0.25s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            .um-btn-save:hover:not(:disabled) {
              background: #2563eb;
              box-shadow: 0 6px 20px rgba(59,130,246,0.4);
              transform: translateY(-1px);
            }
            .um-btn-save:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }

            /* ── LOADING DOTS ── */
            .um-loading-dots { display: flex; gap: 5px; align-items: center; }
            .um-loading-dots span {
              width: 6px; height: 6px;
              background: white;
              border-radius: 50%;
              animation: umDotPulse 1.2s ease-in-out infinite;
            }
            .um-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
            .um-loading-dots span:nth-child(3) { animation-delay: 0.4s; }


            /* ══════════════════════════════════════════
               DARK MODE OVERRIDES
               Triggered by body[data-theme='dark']
            ══════════════════════════════════════════ */

            body[data-theme='dark'] .um-overlay {
              background: rgba(2, 6, 23, 0.82);
            }
            body[data-theme='dark'] .um-modal {
              background: #0f172a;
              border-color: rgba(255,255,255,0.08);
              box-shadow:
                0 0 0 1px rgba(59,130,246,0.12),
                0 32px 80px rgba(0,0,0,0.6),
                0 8px 24px rgba(0,0,0,0.4);
            }
            body[data-theme='dark'] .um-header {
              border-bottom-color: rgba(255,255,255,0.07);
              background: linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(15,23,42,0) 60%);
            }
            body[data-theme='dark'] .um-title { color: #f8fafc; }
            body[data-theme='dark'] .um-subtitle { color: #64748b; }
            body[data-theme='dark'] .um-close-btn {
              background: rgba(255,255,255,0.06);
              border-color: rgba(255,255,255,0.08);
              color: #94a3b8;
            }
            body[data-theme='dark'] .um-close-btn:hover {
              background: rgba(239,68,68,0.15);
              border-color: rgba(239,68,68,0.3);
              color: #f87171;
              box-shadow: 0 0 12px rgba(239,68,68,0.2);
            }
            body[data-theme='dark'] .um-body {
              scrollbar-color: rgba(255,255,255,0.1) transparent;
            }
            body[data-theme='dark'] .um-body::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.1);
            }
            body[data-theme='dark'] .um-label { color: #94a3b8; }
            body[data-theme='dark'] .um-hint { color: #475569; }
            body[data-theme='dark'] .um-role-desc { color: #475569; }
            body[data-theme='dark'] .um-divider { background: rgba(255,255,255,0.06); }
            body[data-theme='dark'] .um-perm-badge {
              background: rgba(59,130,246,0.15);
              color: #60a5fa;
              border-color: rgba(59,130,246,0.25);
            }
            body[data-theme='dark'] .um-input-icon { color: #475569; }
            body[data-theme='dark'] .um-input {
              background: #1e293b;
              border-color: rgba(255,255,255,0.08);
              color: #f8fafc;
            }
            body[data-theme='dark'] .um-input::placeholder { color: #334155; }
            body[data-theme='dark'] .um-input:hover {
              border-color: rgba(255,255,255,0.14);
              background: #1a2844;
            }
            body[data-theme='dark'] .um-input:focus {
              border-color: #3b82f6;
              background: #162035;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
            }
            body[data-theme='dark'] .um-select {
              background: #1e293b;
              border-color: rgba(255,255,255,0.08);
              color: #f8fafc;
            }
            body[data-theme='dark'] .um-select:hover {
              border-color: rgba(255,255,255,0.14);
              background: #1a2844;
            }
            body[data-theme='dark'] .um-select:focus {
              border-color: #3b82f6;
              background: #162035;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
            }
            body[data-theme='dark'] .um-select option { background: #1e293b; color: #f8fafc; }
            body[data-theme='dark'] .um-select-arrow { color: #475569; }
            body[data-theme='dark'] .um-toggle-track {
              background: #1e293b;
              border-color: rgba(255,255,255,0.1);
            }
            body[data-theme='dark'] .um-toggle-track.active {
              background: #3b82f6;
              border-color: #3b82f6;
              box-shadow: 0 0 14px rgba(59,130,246,0.4);
            }
            body[data-theme='dark'] .um-toggle-label { color: #94a3b8; }
            body[data-theme='dark'] .um-perm-card {
              background: #1e293b;
              border-color: rgba(255,255,255,0.07);
            }
            body[data-theme='dark'] .um-perm-card:hover {
              border-color: rgba(59,130,246,0.2);
              box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            }
            body[data-theme='dark'] .um-perm-card-head {
              border-bottom-color: rgba(255,255,255,0.06);
            }
            body[data-theme='dark'] .um-perm-card-icon.blue {
              background: rgba(59,130,246,0.15);
              color: #60a5fa;
              border-color: rgba(59,130,246,0.2);
            }
            body[data-theme='dark'] .um-perm-card-icon.violet {
              background: rgba(139,92,246,0.15);
              color: #a78bfa;
              border-color: rgba(139,92,246,0.2);
            }
            body[data-theme='dark'] .um-perm-card-title { color: #f1f5f9; }
            body[data-theme='dark'] .um-perm-card-desc { color: #475569; }
            body[data-theme='dark'] .um-perm-item:hover {
              background: rgba(255,255,255,0.04);
              border-color: rgba(255,255,255,0.06);
            }
            body[data-theme='dark'] .um-perm-item-icon { color: #475569; }
            body[data-theme='dark'] .um-perm-item-text { color: #94a3b8; }
            body[data-theme='dark'] .um-perm-item:hover .um-perm-item-text { color: #cbd5e1; }
            body[data-theme='dark'] .um-checkbox {
              background: #0f172a;
              border-color: #334155;
            }
            body[data-theme='dark'] .um-checkbox.checked {
              background: #3b82f6;
              border-color: #3b82f6;
              box-shadow: 0 0 10px rgba(59,130,246,0.35);
            }
            body[data-theme='dark'] .um-module-item {
              background: #1e293b;
              border-color: rgba(255,255,255,0.06);
            }
            body[data-theme='dark'] .um-module-item:hover {
              background: #1a2844;
              border-color: rgba(59,130,246,0.18);
            }
            body[data-theme='dark'] .um-module-icon { color: #475569; }
            body[data-theme='dark'] .um-module-name { color: #94a3b8; }
            body[data-theme='dark'] .um-chip {
              background: rgba(255,255,255,0.04);
              border-color: rgba(255,255,255,0.08);
              color: #475569;
            }
            body[data-theme='dark'] .um-chip.active {
              background: rgba(59,130,246,0.18);
              border-color: rgba(59,130,246,0.35);
              color: #60a5fa;
              box-shadow: 0 0 8px rgba(59,130,246,0.15);
            }
            body[data-theme='dark'] .um-chip-label:hover .um-chip:not(.active) {
              background: rgba(255,255,255,0.07);
              color: #94a3b8;
              border-color: rgba(255,255,255,0.14);
            }
            body[data-theme='dark'] .um-footer {
              border-top-color: rgba(255,255,255,0.07);
              background: rgba(15,23,42,0.8);
            }
            body[data-theme='dark'] .um-btn-cancel {
              background: transparent;
              border-color: rgba(255,255,255,0.1);
              color: #94a3b8;
            }
            body[data-theme='dark'] .um-btn-cancel:hover {
              background: rgba(255,255,255,0.05);
              border-color: rgba(255,255,255,0.18);
              color: #f8fafc;
            }
            body[data-theme='dark'] .um-btn-save {
              box-shadow: 0 0 20px rgba(59,130,246,0.35), 0 4px 15px rgba(59,130,246,0.2);
            }
            body[data-theme='dark'] .um-btn-save:hover:not(:disabled) {
              box-shadow: 0 0 30px rgba(59,130,246,0.5), 0 8px 20px rgba(59,130,246,0.3);
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
