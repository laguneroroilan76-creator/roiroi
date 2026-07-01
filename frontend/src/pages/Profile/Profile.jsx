import { useState, useRef, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';
import api, { BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Camera, User, Mail, Shield, Activity, Edit3, CheckCircle2
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', status: 'Active', inactiveReason: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const { showToast } = useToast();

  const avatarInputRef = useRef(null);

  useEffect(() => {
    // Parse user from localStorage initially
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        setEditForm({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          status: parsedUser.status || 'Active',
          inactiveReason: parsedUser.inactiveReason || ''
        });
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch fresh user data from the server to pick up admin-side changes (e.g. role)
    const fetchFreshUser = async () => {
      try {
        const res = await api.get('/users/me');
        if (res.data) {
          const saved = localStorage.getItem('user');
          const existing = saved ? JSON.parse(saved) : {};
          const merged = { ...existing, ...res.data };
          localStorage.setItem('user', JSON.stringify(merged));
          setUser(merged);
          setEditForm({
            name: merged.name || '',
            email: merged.email || '',
            status: merged.status || 'Active',
            inactiveReason: merged.inactiveReason || ''
          });
        }
      } catch (e) {
        console.error('Could not refresh user data:', e);
      }
    };
    fetchFreshUser();

    // Fetch Activity Feed
    fetchActivityFeed();
  }, []);

  const fetchActivityFeed = async () => {
    try {
      setIsLoadingActivity(true);
      const res = await api.get('/users/activity-feed');
      if (res.data) {
        setActivityFeed(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity feed:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploading(true);
      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = { ...user, avatarUrl: response.data.avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Profile picture updated!', 'success');
      fetchActivityFeed();
    } catch (err) {
      console.error('Avatar upload error:', err);
      const msg = err.response?.data?.error || 'Failed to upload profile picture';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      showToast('Name and email cannot be empty', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      // If user is a driver, update their status via driver routes
      if (user.role === 'Driver') {
        const driverRes = await api.put(`/drivers/${user.id}`, {
          status: editForm.status,
          inactiveReason: editForm.status === 'Inactive' ? editForm.inactiveReason : null
        });
        const updatedUser = {
          ...user,
          name: editForm.name,
          email: editForm.email,
          status: driverRes.data.status,
          inactiveReason: driverRes.data.inactiveReason
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else if (user.canApprove || user.role === 'Admin') {
        const response = await api.put(`/users/${user.id}`, {
          name: editForm.name,
          email: editForm.email
        });
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        const updatedUser = { ...user, name: editForm.name, email: editForm.email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      showToast('Profile information saved!', 'success');
      setIsEditing(false);
      fetchActivityFeed();
    } catch (err) {
      console.error('Profile save error:', err);
      showToast(err.response?.data?.error || 'Failed to save profile details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="profile-loading">Loading profile...</div>;

  // Compute profile completion elements
  const completionSteps = [
    { label: 'Name set', done: !!user.name },
    { label: 'Email verified', done: !!user.email },
    { label: 'Avatar uploaded', done: !!user.avatarUrl }
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercentage = Math.round((completedCount / completionSteps.length) * 100);

  const userInitials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="profile-dashboard">
      <header className="dashboard-header-bar">
        <div className="header-meta">
          <span className="meta-breadcrumb">Dashboard</span>
          <h1 className="header-title">My Profile</h1>
          <p className="header-desc">Manage your identity, settings, and account activity.</p>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} />
              Edit Profile
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </header>

      <div className="profile-grid">
        {/* LEFT COLUMN */}
        <div className="grid-column-left">
          {/* Avatar Card */}
          <div className="saas-card avatar-card">
            <div className="avatar-wrapper">
              <div className="avatar-container" onClick={() => avatarInputRef.current?.click()} title="Change Profile Picture">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`} alt="Avatar" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">{userInitials}</div>
                )}
                <div className="avatar-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={avatarInputRef}
                onChange={handleAvatarChange}
              />
              {isUploading && <span className="upload-indicator">Uploading...</span>}
            </div>

            <div className="user-details-brief">
              <div className="status-indicator">
                <span className={`status-dot ${user.status === 'Inactive' ? 'offline' : 'online'}`}></span>
                <span style={{ color: user.status === 'Inactive' ? '#ef4444' : '#10b981' }}>{user.status === 'Inactive' ? 'Inactive' : 'Active Now'}</span>
              </div>
              <h2 className="user-display-name">{user.name}</h2>
              <p className="user-display-email">{user.email}</p>

              {user.role === 'Admin' ? (
                <span className={`role-badge ${user.role?.toLowerCase() || 'user'}`}>
                  {user.role || 'Standard User'}
                </span>
              ) : user.company?.name ? (
                <span className="role-badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
                  {user.company?.name}
                </span>
              ) : null}
            </div>

            {/* Profile Completion Progress */}
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Profile Strength</span>
                <span className="progress-pct">{completionPercentage}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }}></div>
              </div>
              <ul className="completion-checklist">
                {completionSteps.map((step, idx) => (
                  <li key={idx} className={step.done ? 'done' : 'pending'}>
                    <CheckCircle2 size={12} className="check-icon" />
                    {step.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="grid-column-center">
          {/* Account Settings / Profile Editing */}
          <div className="saas-card settings-card">
            <div className="card-header">
              <div className="header-title-group">
                <User size={18} className="icon-title" />
                <h3>Personal details</h3>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="edit-profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Full Name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                {user.role === 'Driver' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="status">Driver Status</label>
                      <select
                        id="status"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
                      >
                        <option value="Active">Active (Available for trips)</option>
                        <option value="Inactive">Inactive (On leave, Unavailable)</option>
                      </select>
                    </div>

                    {editForm.status === 'Inactive' && (
                      <div className="form-group">
                        <label htmlFor="inactiveReason">Reason for Inactivity</label>
                        <textarea
                          id="inactiveReason"
                          value={editForm.inactiveReason}
                          onChange={(e) => setEditForm({ ...editForm, inactiveReason: e.target.value })}
                          placeholder="e.g., On Leave, Sick, Vehicle Maintenance"
                          style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', minHeight: '80px', resize: 'vertical' }}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving Changes...' : 'Save changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="details-read-only">
                <div className="read-row">
                  <span className="label">Full Name</span>
                  <span className="value">{user.name || 'Not configured'}</span>
                </div>
                <div className="read-row">
                  <span className="label">Email Address</span>
                  <span className="value">{user.email || 'Not configured'}</span>
                </div>
                {user.role === 'Admin' && (
                  <div className="read-row">
                    <span className="label">System Role</span>
                    <span className="value role-highlight">{user.role}</span>
                  </div>
                )}
                {user.company?.name && (
                  <div className="read-row">
                    <span className="label">Company</span>
                    <span className="value">{user.company?.name}</span>
                  </div>
                )}

                {user.role === 'Driver' && (
                  <div className="read-row">
                    <span className="label">Current Status</span>
                    <span className="value">
                      <span className={`role-badge ${user.status === 'Inactive' ? 'admin' : 'guard'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                        {user.status || 'Active'}
                      </span>
                      {user.status === 'Inactive' && user.inactiveReason && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          Reason: {user.inactiveReason}
                        </div>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permissions management */}
          <div className="saas-card permissions-card">
            <div className="card-header">
              <div className="header-title-group">
                <Shield size={18} className="icon-title" />
                <h3>Assigned Permissions & Access Levels</h3>
              </div>
            </div>
            <p className="card-sub">Color-coded security privileges and verification scopes active for your session.</p>

            <div className="permissions-wrapper">
              {user.role === 'Admin' && <span className="perm-pill admin">Full Administrative System Control</span>}
              {user.canApprove && <span className="perm-pill primary">Full Form Approver</span>}
              {user.canApprovePRF && <span className="perm-pill success">PRF Approver</span>}
              {user.canApproveRFP && <span className="perm-pill warning">RFP Approver</span>}
              {user.canApproveTripTicket && <span className="perm-pill info">Trip Ticket Approver</span>}
              {user.canApproveDeptHead && <span className="perm-pill dept">Department Head Scope</span>}
              {user.canEndorse && <span className="perm-pill endorse">Endorser Access</span>}
              {user.canVerify && <span className="perm-pill verify">Verifier Access</span>}

              {!user.canApprove && !user.canApprovePRF && !user.canApproveRFP &&
                !user.canApproveTripTicket && !user.canApproveDeptHead && !user.canEndorse &&
                !user.canVerify && (
                  <span className="perm-pill standard">Standard Account (Read-Only/Submission only)</span>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="grid-column-right">
          {/* Activity Widget */}
          <div className="saas-card activity-widget">
            <div className="card-header">
              <div className="header-title-group">
                <Activity size={18} className="icon-title" />
                <h3>Recent Activity Feed</h3>
              </div>
              <button className="btn-text" onClick={fetchActivityFeed}>Refresh</button>
            </div>

            <div className="activity-list">
              {isLoadingActivity ? (
                <div className="loading-small">Fetching events...</div>
              ) : activityFeed.length > 0 ? (
                activityFeed.slice(0, 5).map((log) => (
                  <div className="activity-item" key={log.id}>
                    <div className="activity-marker"></div>
                    <div className="activity-content">
                      <p className="activity-desc">
                        <strong>{log.user?.name || 'You'}</strong> {log.action} {log.resource}
                      </p>
                      <span className="activity-time">
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <p>No recent activity detected on this account.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
