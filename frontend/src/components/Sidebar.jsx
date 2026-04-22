import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showForms, setShowForms] = useState(false);
  
  let user = null;
  try {
    const saved = localStorage.getItem('user');
    user = saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to parse user data');
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <aside className="glass-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">💠</span>
          <div className="logo-text">
            <h2>HDI</h2>
            <span>Premium Portal</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
           <span className="icon">🏠</span> Dashboard
        </div>

        <div className="nav-group">
            <div className={`nav-item ${location.pathname.includes('/forms') ? 'active' : ''}`} onClick={() => setShowForms(!showForms)}>
                <span className="icon">📄</span> Forms
                <span className={`chevron ${showForms ? 'open' : ''}`}>›</span>
            </div>
            {showForms && (
                <div className="sub-nav">
                    <div className={`sub-item ${isActive('/trip-ticket') ? 'active' : ''}`} onClick={() => navigate('/trip-ticket')}>
                        Trip Ticket
                    </div>
                    <div className={`sub-item ${isActive('/prf') ? 'active' : ''}`} onClick={() => navigate('/prf')}>
                        PRF Form
                    </div>
                </div>
            )}
        </div>

        <div className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => navigate('/history')}>
           <span className="icon">📅</span> Records Calendar
        </div>

        <div className={`nav-item ${isActive('/users') ? 'active' : ''}`} onClick={() => navigate('/users')}>
           <span className="icon">👥</span> User Management
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info clickable-profile" onClick={() => navigate('/profile')} title="View Profile & Signature">
            <div className="user-avatar">
                {user?.signatureUrl ? (
                    <img src={user.signatureUrl.startsWith('http') ? user.signatureUrl : `http://localhost:5000${user.signatureUrl}`} alt="E-Sign" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} />
                ) : (
                    user?.name?.[0] || 'U'
                )}
            </div>
            <div className="user-details">
                <p className="user-name">{user?.name || 'User'}</p>
                <p className="user-email">{user?.email}</p>
            </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
        </button>
      </div>

      <style>{`
        .glass-sidebar {
            width: 280px;
            height: 100vh;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
        }

        .sidebar-header { padding: 2.5rem 2rem; }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { 
            font-size: 2rem; 
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .logo-text h2 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
        .logo-text span { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

        .sidebar-nav { flex: 1; padding: 0 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        
        .nav-item {
            padding: 0.8rem 1.2rem;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center; gap: 12px;
            color: var(--text-dim);
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .nav-item:hover { background: rgba(255,255,255, 0.05); color: white; }
        .nav-item.active { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }

        .icon { font-size: 1.2rem; width: 24px; text-align: center; }
        .chevron { margin-left: auto; transition: transform 0.3s; font-size: 1.2rem; color: var(--text-dim); }
        .chevron.open { transform: rotate(90deg); }

        .sub-nav { padding-left: 3rem; display: flex; flex-direction: column; gap: 4px; margin: 4px 0; }
        .sub-item {
            padding: 0.6rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            color: var(--text-dim);
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .sub-item:hover { color: white; }
        .sub-item.active { color: #818cf8; font-weight: 600; }

        .sidebar-footer { padding: 1.5rem; border-top: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); }
        .user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
        .user-avatar { 
            width: 40px; height: 40px; border-radius: 10px; 
            background: linear-gradient(135deg, #6366f1, #a855f7);
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; color: white;
        }
        .user-details { overflow: hidden; }
        .user-name { font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .logout-btn {
            width: 100%; padding: 0.8rem; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.2);
            background: rgba(239, 68, 68, 0.05); color: #f87171; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            font-weight: 600; transition: all 0.3s;
        }
        .logout-btn:hover { background: #ef4444; color: white; transform: translateY(-2px); }

        .clickable-profile { cursor: pointer; padding: 0.5rem; border-radius: 12px; transition: background 0.2s; margin: -0.5rem -0.5rem 1rem -0.5rem; }
        .clickable-profile:hover { background: rgba(255,255,255,0.08); }

        @media print {
            .glass-sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
