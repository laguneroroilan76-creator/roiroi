import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Parse user from localStorage
    try {
      const saved = localStorage.getItem('user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG/JPG)');
        return;
    }

    const formData = new FormData();
    formData.append('signature', file);

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/users/profile/signature', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const updatedUser = { ...user, signatureUrl: response.data.signatureUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Sync LocalStorage
      alert('E-Signature uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload signature. Ensure your backend is running and configured correctly.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return <div className="profile-page">Loading...</div>;

  const fullSignatureUrl = user.signatureUrl && !user.signatureUrl.startsWith('http') 
    ? `http://localhost:5000${user.signatureUrl}` 
    : user.signatureUrl;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 My Profile</h1>
      </div>

      <div className="profile-container">
        <div className="profile-card glass">
          <div className="avatar-section">
            <div className="big-avatar">{user.name?.[0] || 'U'}</div>
            <h2>{user.name}</h2>
            <p className="email">{user.email}</p>
            {user.canApprove ? (
                <span className="badge true">Forms Approver</span>
            ) : (
                <span className="badge false">Standard User</span>
            )}
          </div>
        </div>

        <div className="signature-card glass">
          <h2>My E-Signature</h2>
          <p className="subtitle">Upload a clear picture or transparent PNG of your signature to be used in document approvals.</p>

          <div className="signature-preview">
            {fullSignatureUrl ? (
                <img src={fullSignatureUrl} alt="E-Signature Preview" />
            ) : (
                <div className="no-signature">No signature uploaded yet.</div>
            )}
          </div>

          <div className="upload-controls">
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              className="btn upload-btn" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload New Signature'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page { padding: 3rem; max-width: 1000px; margin: 0 auto; color: white; }
        .page-header h1 { font-size: 2.2rem; margin-bottom: 2rem; }
        
        .profile-container { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }
        
        .profile-card { padding: 3rem 2rem; text-align: center; border-radius: 20px; border: 1px solid var(--glass-border); height: fit-content; }
        .big-avatar { 
            width: 100px; height: 100px; border-radius: 24px; background: linear-gradient(135deg, #6366f1, #a855f7); 
            display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800;
            margin: 0 auto 1.5rem auto; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
        }
        .profile-card h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .profile-card .email { color: var(--text-dim); margin-bottom: 1.5rem; }
        .badge { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.true { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .badge.false { background: rgba(255, 255, 255, 0.1); color: #94a3b8; }

        .signature-card { padding: 3rem; border-radius: 20px; border: 1px solid var(--glass-border); }
        .signature-card h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-dim); margin-bottom: 2rem; line-height: 1.6; }

        .signature-preview { 
            width: 100%; height: 250px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 16px;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
            background: rgba(0,0,0,0.2); margin-bottom: 2rem;
        }
        .signature-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .no-signature { color: var(--text-dim); font-style: italic; }

        .upload-controls { display: flex; justify-content: center; }
        .upload-btn { background: var(--primary); padding: 1rem 2rem; font-size: 1.05rem; }
        .upload-btn.disabled { background: rgba(255,255,255,0.05); color: #64748b; cursor: not-allowed; border: 1px solid rgba(255,255,255,0.1); }
        .lock-icon { margin-right: 8px; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
