import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showForms, setShowForms] = useState(false);
  const [showApproved, setShowApproved] = useState(false);

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
  const isAccounting = user?.role === 'Accounting';

  // Helper to check permission
  const canView = (module) => {
    if (isAdmin) return true;
    if (!user?.permissions) return true; // Default to true if no permissions object (legacy)
    const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    return perms?.[module]?.view !== false;
  };

  useEffect(() => {
    const isFormPath = ['/trip-ticket', '/prf', '/rfp'].includes(location.pathname);
    const isReadOnly = location.state?.readOnly;
    const isReview = location.state?.isReview;
    const isArchived = location.state?.isArchived;

    if (isFormPath && !isReadOnly && !isReview && !isArchived) {
      setShowForms(true);
    }

    if ((location.pathname === '/approved' && !location.state?.isInbox) || (isReadOnly && !isReview && !isArchived && !location.state?.isInbox)) {
      setShowApproved(true);
    }

    // Reset dropdowns if we are in review or archived view to keep sidebar clean
    if (isReview || isArchived) {
      setShowForms(false);
      setShowApproved(false);
    }
  }, [location.pathname, location.state]);

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
          <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => { navigate('/dashboard'); onClose(); }}>
            Dashboard
          </div>
        )}

        {isGuard && (
          <div className={`nav-item ${isActive('/guard-dashboard') ? 'active' : ''}`} onClick={() => { navigate('/guard-dashboard'); onClose(); }}>
            Trip Ticket Log
          </div>
        )}

        {!isGuard && (canView('tripTicket') || canView('prf') || canView('rrf')) && (
          <div className="nav-group">
            <div
              className={`nav-item ${['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && !location.state?.readOnly && !location.state?.isReview ? 'active' : ''}`}
              onClick={() => setShowForms(!showForms)}
            >
              Forms
              <span className={`chevron ${showForms ? 'open' : ''}`}>›</span>
            </div>
            {showForms && (
              <div className="sub-nav">
                {canView('tripTicket') && (
                  <div
                    className={`sub-item ${location.pathname === '/trip-ticket' && !location.state?.readOnly && !location.state?.isReview ? 'active' : ''}`}
                    onClick={() => { navigate('/trip-ticket', { state: null }); onClose(); }}
                  >
                    Trip Ticket
                  </div>
                )}
                {canView('prf') && (
                  <div
                    className={`sub-item ${location.pathname === '/prf' && !location.state?.readOnly && !location.state?.isReview ? 'active' : ''}`}
                    onClick={() => { navigate('/prf', { state: null }); onClose(); }}
                  >
                    Purchase Requisition (PRF)
                  </div>
                )}
                {canView('rfp') || canView('rrf') ? (
                  <div
                    className={`sub-item ${location.pathname === '/rfp' && !location.state?.readOnly && !location.state?.isReview ? 'active' : ''}`}
                    onClick={() => { navigate('/rfp', { state: null }); onClose(); }}
                  >
                    Request For Payment (RFP)
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {(user?.canApprove || isAccounting) && !isGuard && (
          <div className={`nav-item ${isActive('/pending') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isReview) ? 'active' : ''}`} onClick={() => { navigate('/pending'); onClose(); }}>
            Pending Approvals
          </div>
        )}

        {!isGuard && (
          <div className="nav-group">
            <div
              className={`nav-item ${(isActive('/approved') && !location.state?.isInbox) || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.readOnly && !location.state?.isReview && !location.state?.isArchived && !location.state?.isInbox) ? 'active' : ''}`}
              onClick={() => setShowApproved(!showApproved)}
            >
              Approved Records
              <span className={`chevron ${showApproved ? 'open' : ''}`}>›</span>
            </div>
            {showApproved && (
              <div className="sub-nav">
                <div
                  className={`sub-item ${location.state?.filter === 'TRIP_TICKET' ? 'active' : ''}`}
                  onClick={() => { navigate('/approved', { state: { filter: 'TRIP_TICKET' } }); onClose(); }}
                >
                  Trip Tickets
                </div>
                <div
                  className={`sub-item ${location.state?.filter === 'PRF' ? 'active' : ''}`}
                  onClick={() => { navigate('/approved', { state: { filter: 'PRF' } }); onClose(); }}
                >
                  Purchase Requisition (PRF)
                </div>
                {!isGuard && (
                  <div
                    className={`sub-item ${location.state?.filter === 'RFP' && !location.state?.isInbox ? 'active' : ''}`}
                    onClick={() => { navigate('/approved', { state: { filter: 'RFP' } }); onClose(); }}
                  >
                    Request For Payment (RFP)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(isAdmin || isDriver) && !isAccounting && (
          <div className={`nav-item ${isActive('/driver-schedule') ? 'active' : ''}`} onClick={() => { navigate('/driver-schedule'); onClose(); }}>
            Driving Schedule
          </div>
        )}

        {!isGuard && canView('history') && (
          <div className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => { navigate('/history'); onClose(); }}>
            {user?.canApprove ? "History & Activity" : "My Requests"}
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('archived') && (
          <div className={`nav-item ${isActive('/archived') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isArchived) ? 'active' : ''}`} onClick={() => { navigate('/archived'); onClose(); }}>
            Archived Records
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('vehicles') && (
          <div className={`nav-item ${isActive('/vehicles') ? 'active' : ''}`} onClick={() => { navigate('/vehicles'); onClose(); }}>
            Vehicle Management
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('users') && (
          <div className={`nav-item ${isActive('/users') ? 'active' : ''}`} onClick={() => { navigate('/users'); onClose(); }}>
            User Management
          </div>
        )}

        {isAccounting && (
          <div 
            className={`nav-item ${(location.pathname === '/approved' || location.pathname === '/rfp') && location.state?.isInbox ? 'active' : ''}`}
            onClick={() => { navigate('/approved', { state: { filter: 'RFP', isInbox: true } }); onClose(); }}
          >
            RFP Inbox
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info clickable-profile" onClick={() => { navigate('/profile'); onClose(); }} title="View Profile & Signature">
          <div className="user-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://172.16.28.96:5000${user.avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
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
          Logout
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

        @media (max-width: 1024px) {
          .glass-sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
            box-shadow: ${isOpen ? '20px 0 50px rgba(0,0,0,0.2)' : 'none'};
          }
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

        .sidebar-nav { 
          flex: 1; 
          padding: 0 1.2rem; 
          display: flex; 
          flex-direction: column; 
          gap: 0.4rem; 
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }

        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark-mode .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        
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
