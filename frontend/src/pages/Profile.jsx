import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${window.location.protocol}//${window.location.hostname}:5000/api/users/profile/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
                  <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${window.location.protocol}//${window.location.hostname}:5000${user.avatarUrl}`} alt="Avatar" className="avatar-img" />
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
              ) : user.company ? (
                <span className="role-badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
                  {user.company}
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
                {user.company && (
                  <div className="read-row">
                    <span className="label">Company</span>
                    <span className="value">{user.company}</span>
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .profile-dashboard {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          min-height: 100vh;
          padding: 2.5rem 2rem;
          color: #0f172a;
          transition: background-color 0.3s ease;
        }

        .dark-mode .profile-dashboard {
          background-color: #0f172a;
          color: #f8fafc;
        }

        /* HEADER BAR */
        .dashboard-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dark-mode .dashboard-header-bar {
          border-bottom: 1px solid #1e293b;
        }

        .meta-breadcrumb {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 600;
        }

        .header-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .header-desc {
          font-size: 0.925rem;
          color: #64748b;
        }

        /* GRID LAYOUT */
        .profile-grid {
          display: grid;
          grid-template-columns: 280px 1fr 340px;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1200px) {
          .profile-grid {
            grid-template-columns: 280px 1fr;
          }
          .grid-column-right {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .grid-column-left, .grid-column-center, .grid-column-right {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* PREMIUM SAAS CARDS */
        .saas-card {
          background-color: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }

        .saas-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        .dark-mode .saas-card {
          background-color: #1e293b;
          border-color: #334155;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .card-sub {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: -0.75rem;
          margin-bottom: 1.5rem;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-title-group h3 {
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .icon-title {
          color: var(--primary-accent, #2563eb);
        }

        /* AVATAR CARD */
        .avatar-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .avatar-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .avatar-container {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          background-color: var(--primary-accent, #2563eb);
          cursor: pointer;
          border: 4px solid #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .dark-mode .avatar-container {
          border-color: #334155;
        }

        .avatar-container:hover {
          transform: scale(1.03);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          font-weight: 800;
          color: #fff;
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          color: #fff;
          transition: opacity 0.2s ease;
        }

        .avatar-container:hover .avatar-overlay {
          opacity: 1;
        }

        .upload-indicator {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.5rem;
        }

        .user-details-brief {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.5rem;
          width: 100%;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem;
        }

        .dark-mode .user-details-brief {
          border-bottom-color: #334155;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .status-dot.offline {
          background-color: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }

        .user-display-name {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .user-display-email {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 1rem 0;
        }

        /* ROLE BADGES */
        .role-badge {
          display: inline-flex;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .role-badge.admin {
          background-color: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        .role-badge.guard {
          background-color: rgba(245, 158, 11, 0.08);
          color: #f59e0b;
        }

        .role-badge.user {
          background-color: rgba(37, 99, 235, 0.08);
          color: #2563eb;
        }

        /* PROFILE COMPLETION PROGRESS */
        .progress-section {
          width: 100%;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .progress-bar-track {
          width: 100%;
          height: 6px;
          background-color: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .dark-mode .progress-bar-track {
          background-color: #334155;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: var(--primary-accent, #2563eb);
          border-radius: 9999px;
          transition: width 0.4s ease-out;
        }

        .completion-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: left;
        }

        .completion-checklist li {
          font-size: 0.775rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .completion-checklist li.done {
          color: #10b981;
        }

        .completion-checklist li.pending {
          color: #94a3b8;
        }

        .check-icon {
          flex-shrink: 0;
        }

        /* FORM INPUTS & BUTTONS */
        .details-read-only {
          display: flex;
          flex-direction: column;
        }

        .read-row {
          display: flex;
          align-items: center;
          padding: 1.2rem 0;
          border-bottom: 1px solid var(--border-subtle, #e2e8f0);
        }

        .read-row:last-child {
          border-bottom: none;
        }

        .dark-mode-active .read-row {
          border-bottom-color: #334155;
        }

        .read-row .label {
          width: 140px;
          color: var(--text-dim, #64748b);
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .read-row .value {
          flex: 1;
          color: var(--text-main, #1e293b);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .edit-profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }

        .input-with-icon input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 0.95rem;
          background-color: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .dark-mode .input-with-icon input {
          background-color: #1a202c;
          border-color: #4a5568;
          color: #f8fafc;
        }

        .input-with-icon input:focus {
          outline: none;
          border-color: var(--primary-accent, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          font-size: 0.925rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-primary {
          background-color: var(--primary-accent, #2563eb);
          color: #ffffff;
        }

        .btn-primary:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: #e2e8f0;
          color: #0f172a;
        }

        .btn-secondary:hover {
          background-color: #cbd5e1;
        }

        .dark-mode .btn-secondary {
          background-color: #334155;
          color: #f8fafc;
        }

        .dark-mode .btn-secondary:hover {
          background-color: #475569;
        }

        /* READ-ONLY DETAILS */
        .details-read-only {
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .dark-mode .details-read-only {
          border-color: #334155;
        }

        .read-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background-color: #fff;
        }

        .dark-mode .read-row {
          border-bottom-color: #334155;
          background-color: #1e293b;
        }

        .read-row:last-child {
          border-bottom: none;
        }

        .read-row .label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }

        .read-row .value {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .role-highlight {
          color: var(--primary-accent, #2563eb);
        }

        /* PERMISSIONSbadges */
        .permissions-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        .perm-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .perm-pill.admin { background-color: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .perm-pill.primary { background-color: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .perm-pill.success { background-color: rgba(16, 185, 129, 0.08); color: #10b981; }
        .perm-pill.warning { background-color: rgba(245, 158, 11, 0.08); color: #f59e0b; }
        .perm-pill.info { background-color: rgba(6, 182, 212, 0.08); color: #06b6d4; }
        .perm-pill.dept { background-color: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
        .perm-pill.endorse { background-color: rgba(236, 72, 153, 0.08); color: #ec4899; }
        .perm-pill.verify { background-color: rgba(20, 184, 166, 0.08); color: #14b8a6; }
        .perm-pill.standard { background-color: #f1f5f9; color: #64748b; }

        .dark-mode .perm-pill.standard {
          background-color: #334155;
          color: #cbd5e1;
        }

        /* SIGNATURE VERIFICATION */
        .signature-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: center;
        }

        @media (max-width: 640px) {
          .signature-layout {
            grid-template-columns: 1fr;
          }
        }

        .signature-preview-box {
          height: 130px;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          overflow: hidden;
          transition: background-color 0.2s;
        }

        .dark-mode-active .signature-preview-box {
          background-color: #0f172a;
          border-color: #334155;
        }

        .sig-img-preview {
          max-height: 90%;
          max-width: 90%;
          object-fit: contain;
        }

        .no-sig-message {
          text-align: center;
          color: #94a3b8;
        }

        .no-sig-message p {
          font-size: 0.775rem;
          margin: 0.25rem 0 0 0;
          font-weight: 500;
        }

        .placeholder-icon {
          opacity: 0.5;
        }

        .signature-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sig-guidelines {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.775rem;
          color: #64748b;
          line-height: 1.4;
        }

        .info-icon {
          flex-shrink: 0;
          margin-top: 0.15rem;
          color: var(--primary-accent, #2563eb);
        }

        /* ACTIVITY FEED WIDGET */
        .activity-widget {
          display: flex;
          flex-direction: column;
        }

        .btn-text {
          background: none;
          border: none;
          color: var(--primary-accent, #2563eb);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          padding-left: 0.5rem;
          margin-top: 1rem;
        }

        .activity-list::before {
          content: '';
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: calc(0.5rem + 5px);
          width: 2px;
          background-color: #e2e8f0;
          z-index: 1;
        }

        .dark-mode-active .activity-list::before {
          background-color: #334155;
        }

        .activity-item {
          display: flex;
          gap: 1.25rem;
          position: relative;
        }

        .activity-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--primary-accent, #2563eb);
          background-color: #ffffff;
          margin-top: 4px;
          position: relative;
          z-index: 2;
        }

        .dark-mode-active .activity-marker {
          background-color: #1e293b;
        }

        .activity-content {
          display: flex;
          flex-direction: column;
        }

        .activity-desc {
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .activity-time {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.15rem;
        }

        .loading-small, .no-activity {
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
          padding: 1.5rem 0;
        }

        /* CUSTOMIZATION PREFERENCES */
        .preference-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .dark-mode-active .preference-item {
          border-bottom-color: #334155;
        }

        .preference-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .preference-desc h4 {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
        }

        .preference-desc p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        .theme-preset-pills {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .preset-pill {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--preset-color);
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: transform 0.2s, border-color 0.2s;
        }

        .preset-pill:hover {
          transform: scale(1.1);
        }

        .preset-pill.active {
          border-color: #000;
          transform: scale(1.1);
        }

        .dark-mode-active .preset-pill.active {
          border-color: #fff;
        }

        /* TOGGLE SWITCH */
        .saas-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .saas-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider-round {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #cbd5e1;
          transition: .3s;
          border-radius: 34px;
        }

        .dark-mode-active .slider-round {
          background-color: #475569;
        }

        .slider-round:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        input:checked + .slider-round {
          background-color: #10b981;
        }

        input:focus + .slider-round {
          box-shadow: 0 0 1px #10b981;
        }

        input:checked + .slider-round:before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}
