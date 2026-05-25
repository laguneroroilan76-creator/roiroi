import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Camera } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();
  const { themeColor, updateTheme, isDarkMode, toggleDarkMode } = useTheme();

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    // Parse user from localStorage
    try {
      const saved = localStorage.getItem('user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);


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
    } catch (err) {
      console.error('Avatar upload error:', err);
      const msg = err.response?.data?.error || 'Failed to upload profile picture';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleThemeChange = async (newColor) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${window.location.protocol}//${window.location.hostname}:5000/api/users/profile/theme`, { themeColor: newColor }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      updateTheme(newColor);
      const updatedUser = { ...user, themeColor: newColor };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Theme color updated!', 'success');
    } catch (err) {
      console.error('Theme update error:', err);
      showToast('Failed to update theme color', 'error');
    }
  };

  const handleDarkModeToggle = async () => {
    try {
      const newVal = !isDarkMode;
      const token = localStorage.getItem('token');
      await axios.post(`${window.location.protocol}//${window.location.hostname}:5000/api/users/profile/darkmode`, { isDarkMode: newVal }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toggleDarkMode(newVal);
      const updatedUser = { ...user, isDarkMode: newVal };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast(`Dark mode ${newVal ? 'enabled' : 'disabled'}!`, 'success');
    } catch (err) {
      console.error('Dark mode error:', err);
      showToast('Failed to update display mode', 'error');
    }
  };

  if (!user) return <div className="profile-page">Loading...</div>;


  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        {/* Left Column: Profile Card */}
        <div className="profile-card glass">
          <div className="avatar-section">
            <div className="big-avatar" onClick={() => avatarInputRef.current?.click()} title="Change Profile Picture">
              {user.avatarUrl ? (
                <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${window.location.protocol}//${window.location.hostname}:5000${user.avatarUrl}`} alt="Avatar" className="avatar-img" />
              ) : (
                user.name?.[0] || 'U'
              )}
              <div className="avatar-overlay">
                <Camera size={24} className="camera-icon" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={avatarInputRef}
              onChange={handleAvatarChange}
            />
            <h2>{user.name}</h2>
            <p className="email">{user.email}</p>
            {user.canApprove || user.role === 'Admin' ? (
                <span className="badge true">Forms Approver</span>
            ) : (
                <span className="badge false">Standard User</span>
            )}
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="settings-column">
          <div className="corporate-settings-card glass">
            <div className="settings-header">
              <h2>Account Settings</h2>
              <p>Manage your personal information and system access.</p>
            </div>
            
            <div className="settings-section">
              <h3 className="section-subtitle">Personal Details</h3>
              <div className="details-list">
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{user.name || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="section-subtitle">System Access</h3>
              <div className="details-list">
                <div className="detail-row">
                  <span className="detail-label">Assigned Role</span>
                  <span className="detail-value role-value">{user.role}</span>
                </div>
                <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                  <span className="detail-label" style={{ marginTop: '5px' }}>Permissions</span>
                  <div className="detail-value permissions-list">
                    {user.canApprove && <span className="badge true">Full Approver</span>}
                    {user.canApprovePRF && <span className="badge true">PRF Approver</span>}
                    {user.canApproveRFP && <span className="badge true">RFP Approver</span>}
                    {user.canApproveTripTicket && <span className="badge true">Trip Ticket Approver</span>}
                    {user.canApproveDeptHead && <span className="badge true">Dept Head</span>}
                    {user.canEndorse && <span className="badge true">Endorser</span>}
                    {user.canVerify && <span className="badge true">Verifier</span>}
                    {!user.canApprove && !user.canApprovePRF && !user.canApproveRFP && !user.canApproveTripTicket && !user.canApproveDeptHead && !user.canEndorse && !user.canVerify && <span className="badge false">Standard Access</span>}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        .profile-page { padding: 2rem 3rem; max-width: 100%; margin: 0; color: var(--text-main); }
        .page-header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: var(--text-main); letter-spacing: -1px; }
        
        .profile-container { display: grid; grid-template-columns: 350px 1fr; gap: 3rem; }
        
        .profile-card { padding: 3rem 2rem; text-align: center; border-radius: 24px; border: 1px solid var(--glass-border); background: var(--card-bg); height: fit-content; box-shadow: var(--card-shadow); backdrop-filter: blur(10px); }
        .big-avatar { 
            width: 120px; height: 120px; border-radius: 32px; background: var(--primary); 
            display: flex; align-items: center; justify-content: center; font-size: 3.5rem; font-weight: 800;
            margin: 0 auto 1.5rem auto; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            position: relative; overflow: hidden; cursor: pointer; transition: all 0.3s ease;
            border: 4px solid var(--glass-border); color: white;
        }
        .big-avatar:hover { transform: translateY(-5px) scale(1.02); border-color: var(--primary); }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-overlay { 
            position: absolute; inset: 0; background: rgba(0,0,0,0.5); 
            display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;
        }
        .big-avatar:hover .avatar-overlay { opacity: 1; }
        .camera-icon { font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
        .profile-card h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main); }
        .profile-card .email { color: var(--text-dim); margin-bottom: 1.5rem; font-weight: 500; }
        .badge { padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.true { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge.false { background: var(--primary-light); color: var(--primary); border: 1px solid var(--glass-border); }

        .signature-card { padding: 3rem; border-radius: 24px; border: 1px solid var(--glass-border); background: var(--card-bg); box-shadow: var(--card-shadow); backdrop-filter: blur(10px); }
        .signature-card h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main); }
        .subtitle { color: var(--text-dim); margin-bottom: 2rem; line-height: 1.6; font-weight: 500; }

        .signature-preview { 
            width: 100%; height: 250px; border: 2px dashed var(--glass-border); border-radius: 20px;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
            background: rgba(255, 255, 255, 0.05); margin-bottom: 2rem; transition: var(--transition-smooth);
        }
        .signature-preview img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1)); }
        .no-signature { color: var(--text-dim); font-style: italic; font-weight: 500; }

        .corporate-settings-card { padding: 3rem; border-radius: 24px; border: 1px solid var(--glass-border); background: var(--card-bg); box-shadow: var(--card-shadow); backdrop-filter: blur(10px); }
        .settings-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); }
        .settings-header h2 { color: var(--text-main); margin: 0 0 0.5rem 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; }
        .settings-header p { color: var(--text-dim); margin: 0; font-size: 0.95rem; font-weight: 500; }
        
        .settings-section { margin-bottom: 2.5rem; }
        .settings-section:last-child { margin-bottom: 0; }
        .section-subtitle { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--primary); font-weight: 800; margin-bottom: 1.2rem; }
        
        .details-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--glass-border); border-radius: 16px; overflow: hidden; background: var(--primary-light); }
        .detail-row { display: flex; padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--glass-border); align-items: center; background: var(--card-bg); transition: var(--transition-smooth); }
        .detail-row:last-child { border-bottom: none; }
        .detail-row:hover { background: var(--primary-light); }
        
        .detail-label { flex: 0 0 160px; color: var(--text-dim); font-size: 0.9rem; font-weight: 700; }
        .detail-value { flex: 1; color: var(--text-main); font-size: 1rem; font-weight: 600; }
        .role-value { font-weight: 800; color: var(--primary); }
        
        .permissions-list { display: flex; flex-wrap: wrap; gap: 8px; }

        .color-presets { display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: center; margin-top: 1.5rem; }
        .color-pill { 
            width: 48px; height: 48px; border-radius: 16px; cursor: pointer; transition: var(--transition-smooth); 
            border: 3px solid var(--glass-border);
        }
        .color-pill:hover { transform: translateY(-5px) rotate(8deg); border-color: var(--primary); }
        .color-pill.active { border-color: white; transform: scale(1.1); box-shadow: 0 10px 20px var(--primary-light); outline: 3px solid var(--primary); }
        
        .custom-color-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .custom-color-input { 
            -webkit-appearance: none; border: none; width: 48px; height: 48px; border-radius: 16px; 
            background: none; cursor: pointer; border: 3px solid var(--glass-border); padding: 0;
            transition: var(--transition-smooth);
        }
        .custom-color-input:hover { transform: translateY(-5px); border-color: var(--primary); }
        .custom-color-input::-webkit-color-swatch-wrapper { padding: 0; }
        .custom-color-input::-webkit-color-swatch { border: none; border-radius: 13px; }
        .custom-color-container span { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }

        .dark-mode .signature-preview { background: rgba(0, 0, 0, 0.3); }
        .dark-mode .slider:before { background: white; }
        .dark-mode .toggle-label { color: white !important; }
      `}</style>
    </div>
  );
}
