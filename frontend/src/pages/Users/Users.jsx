import { useState, useEffect } from 'react';
import './Users.css';
import api, { BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
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
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: 'User', permissions: {},
    companyId: '', departmentId: '', departmentRole: '',
    isDriver: false, isRFPApprover: false,
    isSecurityGuard: false,
    isITSpecialist: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchUsers();

    const fetchCompaniesAndDepartments = async () => {
      try {
        const [companiesRes, departmentsRes] = await Promise.all([
          api.get('/companies'),
          api.get('/departments')
        ]);
        setCompanies(companiesRes.data);
        setDepartments(departmentsRes.data);
        if (companiesRes.data.length === 1) {
          setFormData((prev) => ({ ...prev, companyId: companiesRes.data[0].id }));
        }
      } catch (err) {
        console.error('Error fetching companies/departments:', err);
        showToast('Failed to load companies or departments.', 'error');
      }
    };

    fetchCompaniesAndDepartments();
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
        role: user.role || 'User',
        permissions: typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : (user.permissions || {}),
        companyId: user.companyId || '',
        departmentId: user.departmentId || '',
        departmentRole: user.departmentRole || '',
        isDriver: user.isDriver || false,
        isRFPApprover: user.isRFPApprover || false,
        isSecurityGuard: user.isSecurityGuard || false,
        isITSpecialist: user.isITSpecialist || false
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', password: '',
        role: 'User', permissions: {},
        companyId: '', departmentId: '', departmentRole: '',
        isDriver: false, isRFPApprover: false,
        isSecurityGuard: false,
        isITSpecialist: false
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
    <div className="users-page">
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{user.name || 'N/A'}</span>
                    </div>
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
                </div>
                <div className="um-grid-2">
                  <div className="um-field">
                    <label className="um-label">Company</label>
                    <div className="um-select-wrap">
                      <select
                        className="um-select"
                        value={formData.companyId}
                        disabled={formData.isSecurityGuard}
                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      >
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="um-select-arrow" />
                    </div>
                  </div>
                  <div className="um-field">
                    <label className="um-label">Department</label>
                    <div className="um-select-wrap">
                      <select
                        className="um-select"
                        value={formData.departmentId}
                        disabled={formData.isSecurityGuard}
                        onChange={(e) => {
                          const selectedDepartmentId = e.target.value;
                          const departmentName = departments.find((d) => d.id === Number(selectedDepartmentId))?.name;
                          setFormData({
                            ...formData,
                            departmentId: selectedDepartmentId,
                            isRFPApprover: departmentName === 'Accounting' ? formData.isRFPApprover : false,
                            isITSpecialist: departmentName === 'Admin' ? formData.isITSpecialist : false
                          });
                        }}
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="um-select-arrow" />
                    </div>
                  </div>
                </div>

                <div className="um-grid-2">
                  <div className="um-field">
                    <label className="um-label">Department Role</label>
                    <div className="um-select-wrap">
                      <select
                        className="um-select"
                        value={formData.departmentRole}
                        disabled={formData.isSecurityGuard}
                        onChange={(e) => setFormData({ ...formData, departmentRole: e.target.value })}
                      >
                        <option value="">Select Role</option>
                        <option value="President">President</option>
                        <option value="DepartmentHead">Department Head</option>
                        <option value="ImmediateSupervisor">Immediate Supervisor</option>
                        <option value="Staff">Staff</option>
                      </select>
                      <ChevronDown size={15} className="um-select-arrow" />
                    </div>
                  </div>
                  <div className="um-field">
                    <label className="um-master-toggle">
                      <input
                        type="checkbox"
                        checked={formData.isDriver}
                        disabled={formData.isSecurityGuard}
                        onChange={(e) => setFormData({ ...formData, isDriver: e.target.checked })}
                      />
                      <span className={`um-toggle-track ${formData.isDriver ? 'active' : ''}`}>
                        <span className="um-toggle-thumb" />
                      </span>
                      <span className="um-toggle-label">Driver</span>
                    </label>
                    <label className="um-master-toggle">
                      <input
                        type="checkbox"
                        checked={formData.isSecurityGuard}
                        onChange={e => setFormData({
                          ...formData,
                          isSecurityGuard: e.target.checked,
                          ...(e.target.checked && {
                            companyId: '',
                            departmentId: '',
                            departmentRole: '',
                            isDriver: false,
                          })
                        })}
                      />
                      <span className={`um-toggle-track ${formData.isSecurityGuard ? 'active' : ''}`}>
                        <span className="um-toggle-thumb" />
                      </span>
                      <span className="um-toggle-label">Security Guard</span>
                    </label>
                    {formData.isSecurityGuard && (
                      <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-dim)' }}>
                        Company, Department, and Department Role are not required for Security Guards.
                      </small>
                    )}
                    {departments.find((d) => d.id === Number(formData.departmentId))?.name === 'Accounting' && (
                      <label className="um-master-toggle" style={{ marginTop: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.isRFPApprover}
                          onChange={(e) => setFormData({ ...formData, isRFPApprover: e.target.checked })}
                        />
                        <span className={`um-toggle-track ${formData.isRFPApprover ? 'active' : ''}`}>
                          <span className="um-toggle-thumb" />
                        </span>
                        <span className="um-toggle-label">RFP Approver</span>
                      </label>
                    )}
                    {departments.find((d) => d.id === Number(formData.departmentId))?.name === 'Admin' && (
                      <label className="um-master-toggle" style={{ marginTop: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.isITSpecialist}
                          onChange={(e) => setFormData({ ...formData, isITSpecialist: e.target.checked })}
                        />
                        <span className={`um-toggle-track ${formData.isITSpecialist ? 'active' : ''}`}>
                          <span className="um-toggle-thumb" />
                        </span>
                        <span className="um-toggle-label">IT Specialist</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* SECTION 2 — Module Access */}
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
                        { key: 'rfp', label: 'Payment Request', icon: <CreditCard size={15}/> },
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
                            {['tripTicket', 'prf', 'rfp', 'vehicles', 'users'].includes(module.key) && (
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

          
        </div>
      )}
    </div>
  );
}
