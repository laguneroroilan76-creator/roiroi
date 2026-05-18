import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
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

    // Reset dropdowns if we are in review or archived view to keep sidebar clean
    if (isReview || isArchived) {
      setShowForms(false);
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

        {(isAdmin || 
          user?.canApprove || 
          user?.canApprovePRF || 
          user?.canApproveTripTicket || 
          user?.canApproveRFP || 
          user?.canEndorse || 
          user?.canVerify || 
          user?.canApproveDeptHead || 
          isAccounting) && !isGuard && (
          <div className={`nav-item ${isActive('/pending') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isReview) ? 'active' : ''}`} onClick={() => { navigate('/pending'); onClose(); }}>
            Pending Approvals
          </div>
        )}

        {!isGuard && (
          <div 
            className={`nav-item ${(isActive('/approved') && !location.state?.isInbox) || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.readOnly && !location.state?.isReview && !location.state?.isArchived && !location.state?.isInbox) ? 'active' : ''}`}
            onClick={() => { navigate('/approved'); onClose(); }}
          >
            Approved Records
          </div>
        )}


        {(isAdmin || isDriver) && !isAccounting && (
          <div className={`nav-item ${isActive('/driver-schedule') ? 'active' : ''}`} onClick={() => { navigate('/driver-schedule'); onClose(); }}>
            Driving Schedule
          </div>
        )}

        {!isGuard && canView('history') && (
          <div className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => { navigate('/history'); onClose(); }}>
            {(user?.canApprove || 
              user?.canApprovePRF || 
              user?.canApproveTripTicket || 
              user?.canApproveRFP || 
              user?.canEndorse || 
              user?.canVerify || 
              user?.canApproveDeptHead) ? "History & Activity" : "My Requests"}
          </div>
        )}

        {!isGuard && canView('support') && (
          <div className={`nav-item ${isActive('/support') ? 'active' : ''}`} onClick={() => { navigate('/support'); onClose(); }}>
            Support Log
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
              <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${window.location.protocol}//${window.location.hostname}:5000${user.avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
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
            background: #ffffff;
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
            transition: var(--transition-smooth);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        @media (max-width: 1024px) {
          .glass-sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
            box-shadow: ${isOpen ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'};
          }
        }

        .sidebar-header { padding: 2rem 2rem 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem; }
        .logo { display: flex; align-items: center; justify-content: center; }

        .sidebar-nav { 
          flex: 1; 
          padding: 0 1rem; 
          display: flex; 
          flex-direction: column; 
          gap: 0.25rem; 
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }
        
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

        .nav-item {
            padding: 0.625rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center; gap: 10px;
            color: #475569;
            font-weight: 600;
            font-size: 0.875rem;
            transition: background 0.2s, color 0.2s;
        }

        .nav-item:hover { 
            background: #f1f5f9; 
            color: #0f172a;
        }

        .nav-item.active { 
            background: #0f172a; 
            color: white; 
        }

        .chevron { margin-left: auto; transition: transform 0.2s; font-size: 1rem; opacity: 0.5; }
        .chevron.open { transform: rotate(90deg); opacity: 1; }

        .sub-nav { 
            padding-left: 1rem; 
            display: flex; 
            flex-direction: column; 
            gap: 2px; 
            margin: 0.25rem 0 0.5rem 1rem;
            border-left: 1px solid #e2e8f0;
        }

        .sub-item {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            color: #475569;
            font-size: 0.875rem;
            font-weight: 600;
            transition: background 0.2s, color 0.2s;
        }

        .sub-item:hover { color: #0f172a; background: #f8fafc; }
        .sub-item.active { 
            color: #0f172a; 
            font-weight: 600; 
            background: #f1f5f9;
        }

        .sidebar-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; margin-top: auto; }
        .user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; padding: 0.5rem; border-radius: 6px; transition: background 0.2s; }
        .user-info:hover { background: #f8fafc; }
        
        .user-avatar { 
            width: 36px; height: 36px; border-radius: 6px; 
            background: #0f172a;
            display: flex; align-items: center; justify-content: center;
            font-weight: 600; color: white; font-size: 0.875rem;
            flex-shrink: 0;
        }
        
        .user-details { overflow: hidden; }
        .user-name { font-weight: 600; font-size: 0.875rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        .user-email { font-size: 0.75rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; font-weight: 600; }

        .logout-btn {
            width: 100%; padding: 0.625rem; border-radius: 6px; border: 1px solid #e2e8f0;
            background: white; color: #0f172a; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            font-weight: 500; font-size: 0.875rem; transition: background 0.2s;
        }
        .logout-btn:hover { background: #f8fafc; }

        .clickable-profile { cursor: pointer; }

        @media print {
            .glass-sidebar { display: none !important; }
        }

        .dark-mode .glass-sidebar { background: #0f172a; border-right: 1px solid #1e293b; }
        .dark-mode .sidebar-header, .dark-mode .sidebar-footer { border-color: #1e293b; }
        .dark-mode .nav-item { color: #94a3b8; }
        .dark-mode .nav-item:hover { background: #1e293b; color: white; }
        .dark-mode .nav-item.active { background: white; color: #0f172a; }
        .dark-mode .sub-nav { border-color: #1e293b; }
        .dark-mode .sub-item { color: #94a3b8; }
        .dark-mode .sub-item:hover { background: #1e293b; color: white; }
        .dark-mode .sub-item.active { background: #1e293b; color: white; }
        .dark-mode .user-info:hover { background: #1e293b; }
        .dark-mode .user-name { color: white; }
        .dark-mode .user-avatar { background: white; color: #0f172a; }
        .dark-mode .logout-btn { background: #0f172a; color: white; border-color: #1e293b; }
        .dark-mode .logout-btn:hover { background: #1e293b; }
      `}</style>
    </aside>
  );
}
