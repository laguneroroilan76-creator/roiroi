import { useState, useEffect } from 'react';
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
  const isGuard = user?.role === 'Guard';
  const isAdmin = user?.role === 'Admin';
  const isDriver = user?.role === 'Driver';
  
  // Helper to check permission
  const canView = (module) => {
    if (isAdmin) return true;
    if (!user?.permissions) return true; // Default to true if no permissions object (legacy)
    const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    return perms?.[module]?.view !== false;
  };

  useEffect(() => {
    if (['/trip-ticket', '/prf', '/rrf'].includes(location.pathname)) {
      setShowForms(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <aside className="glass-sidebar">
      <div className="sidebar-header">
        <div className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', padding: '0.5rem 0' }}>
          <img src="/HDI Primary Logo .png" alt="HDI Logo" style={{ width: '140px', height: 'auto', display: 'block' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {!isGuard && (
          <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
            <span className="icon">🏠</span> Dashboard
          </div>
        )}

        {isGuard && (
          <div className={`nav-item ${isActive('/guard-dashboard') ? 'active' : ''}`} onClick={() => navigate('/guard-dashboard')}>
            <span className="icon">🛡️</span> Trip Ticket Log
          </div>
        )}

        {!isGuard && (canView('tripTicket') || canView('prf') || canView('rrf')) && (
        <div className="nav-group">
          <div 
            className={`nav-item ${['/trip-ticket', '/prf', '/rrf'].includes(location.pathname) ? 'active' : ''}`} 
            onClick={() => setShowForms(!showForms)}
          >
            <span className="icon">📄</span> Forms
            <span className={`chevron ${showForms ? 'open' : ''}`}>›</span>
          </div>
          {showForms && (
            <div className="sub-nav">
              {canView('tripTicket') && (
                <div 
                  className={`sub-item ${location.pathname === '/trip-ticket' ? 'active' : ''}`}
                  onClick={() => navigate('/trip-ticket')}
                >
                  Trip Ticket
                </div>
              )}
              {canView('prf') && (
                <div 
                  className={`sub-item ${location.pathname === '/prf' ? 'active' : ''}`}
                  onClick={() => navigate('/prf')}
                >
                  Payment Request Form
                </div>
              )}
              {canView('rrf') && (
                <div 
                  className={`sub-item ${location.pathname === '/rrf' ? 'active' : ''}`}
                  onClick={() => navigate('/rrf')}
                >
                  Request Requisition Form
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {user?.canApprove && !isGuard && (
          <div className={`nav-item ${isActive('/pending') ? 'active' : ''}`} onClick={() => navigate('/pending')}>
            <span className="icon">⏳</span> Pending Approvals
          </div>
        )}

        <div className={`nav-item ${isActive('/approved') ? 'active' : ''}`} onClick={() => navigate('/approved')}>
          <span className="icon">✅</span> Approved Records
        </div>

        {(isAdmin || isDriver) && (
          <div className={`nav-item ${isActive('/driver-schedule') ? 'active' : ''}`} onClick={() => navigate('/driver-schedule')}>
            <span className="icon">🗓️</span> Driving Schedule
          </div>
        )}

        {!isGuard && canView('history') && (
          <div className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => navigate('/history')}>
            <span className="icon">📂</span> {user?.canApprove ? "History & Activity" : "My Requests"}
          </div>
        )}

        {!isGuard && canView('archived') && (
          <div className={`nav-item ${isActive('/archived') ? 'active' : ''}`} onClick={() => navigate('/archived')}>
            <span className="icon">📦</span> Archived Records
          </div>
        )}

        {isAdmin && !isGuard && canView('vehicles') && (
          <div className={`nav-item ${isActive('/vehicles') ? 'active' : ''}`} onClick={() => navigate('/vehicles')}>
            <span className="icon">🚙</span> Vehicles Management
          </div>
        )}

        {isAdmin && !isGuard && canView('users') && (
          <div className={`nav-item ${isActive('/users') ? 'active' : ''}`} onClick={() => navigate('/users')}>
            <span className="icon">👥</span> User Management
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info clickable-profile" onClick={() => navigate('/profile')} title="View Profile & Signature">
          <div className="user-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
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
            background: var(--glass);
            backdrop-filter: blur(25px);
            border-right: 1px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.02);
            transition: var(--transition-smooth);
        }

        .sidebar-header { padding: 3rem 2rem; }
        .logo { display: flex; align-items: center; gap: 14px; }
        .logo-icon { 
            font-size: 2.2rem; 
            background: linear-gradient(135deg, var(--primary), #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.2));
        }
        .logo-text h2 { font-size: 1.6rem; font-weight: 800; letter-spacing: -1px; color: var(--text-main); line-height: 1; }
        .logo-text span { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }

        .sidebar-nav { flex: 1; padding: 0 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; }
        
        .nav-item {
            padding: 0.9rem 1.2rem;
            border-radius: 14px;
            cursor: pointer;
            display: flex;
            align-items: center; gap: 14px;
            color: var(--text-dim);
            font-weight: 500;
            transition: var(--transition-smooth);
        }

        .nav-item:hover { 
            background: var(--primary-light); 
            color: var(--primary);
            transform: translateX(5px);
        }

        .nav-item.active { 
            background: var(--primary); 
            color: white; 
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
            transform: translateX(5px);
        }

        .nav-item.active .icon { color: white; filter: brightness(1.5); }

        .icon { font-size: 1.3rem; width: 28px; text-align: center; }
        .chevron { margin-left: auto; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); font-size: 1.2rem; opacity: 0.5; }
        .chevron.open { transform: rotate(90deg); opacity: 1; }

        .sub-nav { 
            padding-left: 1.5rem; 
            display: flex; 
            flex-direction: column; 
            gap: 4px; 
            margin: 0.5rem 0;
            border-left: 2px solid var(--primary-light);
            margin-left: 2rem;
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .sub-item {
            padding: 0.7rem 1.2rem;
            border-radius: 10px;
            cursor: pointer;
            color: var(--text-dim);
            font-size: 0.92rem;
            font-weight: 500;
            transition: var(--transition-smooth);
        }

        .sub-item:hover { color: var(--primary); background: var(--primary-light); }
        .sub-item.active { 
            color: var(--primary); 
            font-weight: 700; 
            background: var(--primary-light);
            position: relative;
        }
        .sub-item.active::before {
            content: '';
            position: absolute;
            left: -1.7rem;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--primary);
        }

        .sidebar-footer { padding: 2rem 1.5rem; border-top: 1px solid var(--glass-border); margin-top: auto; }
        .user-info { display: flex; align-items: center; gap: 14px; margin-bottom: 1.5rem; padding: 0.8rem; border-radius: 16px; transition: var(--transition-smooth); }
        .user-info:hover { background: var(--primary-light); }
        
        .user-avatar { 
            width: 44px; height: 44px; border-radius: 12px; 
            background: linear-gradient(135deg, var(--primary), #8b5cf6);
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            flex-shrink: 0;
        }
        
        .user-details { overflow: hidden; }
        .user-name { font-weight: 700; font-size: 1rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        .user-email { font-size: 0.8rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }

        .logout-btn {
            width: 100%; padding: 1rem; border-radius: 14px; border: 1px solid rgba(239, 68, 68, 0.1);
            background: rgba(239, 68, 68, 0.03); color: #ef4444; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-weight: 700; transition: var(--transition-smooth);
        }
        .logout-btn:hover { background: #ef4444; color: white; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); }

        .clickable-profile { cursor: pointer; }

        @media print {
            .glass-sidebar { display: none !important; }
        }
        .dark-mode .glass-sidebar { background: rgba(15, 23, 42, 0.85); border-right: 1px solid rgba(255,255,255,0.1); }
        .dark-mode .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.1); }
        .dark-mode .user-info:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </aside>
  );
}
