import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  CheckCircle, 
  Calendar, 
  History, 
  MessageSquare, 
  Archive, 
  Car,
  Users,
  LogOut,
  ChevronDown,
  HeadphonesIcon
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, isCollapsed }) {
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

  const canView = (module) => {
    if (isAdmin || user?.role === 'IT') return true;
    
    // Sensitive modules require explicit 'true' permission if not Admin/IT
    if (['archived', 'vehicles', 'users'].includes(module)) {
        if (!user?.permissions) return false;
        const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
        return perms?.[module]?.view === true;
    }

    // Standard modules (Forms, History, Support) are opt-out (visible by default unless explicitly revoked)
    if (!user?.permissions) return true; 
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

    if (isCollapsed) {
      setShowForms(false);
    }

    // Reset dropdowns if we are in review or archived view to keep sidebar clean
    if (isReview || isArchived) {
      setShowForms(false);
    }
  }, [location.pathname, location.state, isCollapsed]);


  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className={`glass-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', padding: '0.5rem 0', display: 'flex', justifyContent: 'center' }}>
          {isCollapsed ? (
            <img src="/HDI Primary Logo .png" alt="HDI Logo" style={{ width: '40px', height: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'left' }} />
          ) : (
            <img src="/HDI Primary Logo .png" alt="HDI Logo" style={{ width: '140px', height: 'auto', display: 'block' }} />
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {!isGuard && (
          <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => { navigate('/dashboard'); onClose(); }} title="Dashboard">
            <LayoutDashboard size={20} />
            <span className="nav-text">Dashboard</span>
          </div>
        )}

        {isGuard && (
          <div className={`nav-item ${isActive('/guard-dashboard') ? 'active' : ''}`} onClick={() => { navigate('/guard-dashboard'); onClose(); }} title="Trip Ticket Log">
            <Car size={20} />
            <span className="nav-text">Trip Ticket Log</span>
          </div>
        )}

        {!isGuard && (canView('tripTicket') || canView('prf') || canView('rrf')) && (
          <div className="nav-group">
            <div
              className={`nav-item ${['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && !location.state?.readOnly && !location.state?.isReview ? 'active' : ''}`}
              onClick={() => setShowForms(!showForms)}
              title="Forms"
            >
              <FileText size={20} />
              <span className="nav-text">Forms</span>
              <ChevronDown size={16} className={`chevron-icon ${showForms ? 'open' : ''}`} />
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
          <div className={`nav-item ${isActive('/pending') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isReview) ? 'active' : ''}`} onClick={() => { navigate('/pending'); onClose(); }} title="Pending Approvals">
            <CheckSquare size={20} />
            <span className="nav-text">Pending Approvals</span>
          </div>
        )}

        {!isGuard && (
          <div 
            className={`nav-item ${(isActive('/approved') && !location.state?.isInbox) || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.readOnly && !location.state?.isReview && !location.state?.isArchived && !location.state?.isInbox) ? 'active' : ''}`}
            onClick={() => { navigate('/approved'); onClose(); }}
            title="Approved Records"
          >
            <CheckCircle size={20} />
            <span className="nav-text">Approved Records</span>
          </div>
        )}


        {(isAdmin || isDriver) && !isAccounting && (
          <div className={`nav-item ${isActive('/driver-schedule') ? 'active' : ''}`} onClick={() => { navigate('/driver-schedule'); onClose(); }} title="Driving Schedule">
            <Calendar size={20} />
            <span className="nav-text">Driving Schedule</span>
          </div>
        )}

        {!isGuard && canView('history') && (
          <div className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => { navigate('/history'); onClose(); }} title="History & Activity">
            <History size={20} />
            <span className="nav-text">
              {(user?.canApprove || 
                user?.canApprovePRF || 
                user?.canApproveTripTicket || 
                user?.canApproveRFP || 
                user?.canEndorse || 
                user?.canVerify || 
                user?.canApproveDeptHead) ? "History & Activity" : "My Requests"}
            </span>
          </div>
        )}

        <div className={`nav-item ${isActive('/support') ? 'active' : ''}`} onClick={() => { navigate('/support'); onClose(); }} title="Support Log">
          <HeadphonesIcon className="nav-icon" size={20} />
          <span className="nav-text">Support Log</span>
        </div>

        {!isGuard && !isAccounting && (isAdmin || user?.role === 'IT' || canView('archived')) && (
          <div className={`nav-item ${isActive('/archived') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isArchived) ? 'active' : ''}`} onClick={() => { navigate('/archived'); onClose(); }} title="Archived Records">
            <Archive size={20} />
            <span className="nav-text">Archived Records</span>
          </div>
        )}

        {!isGuard && !isAccounting && (isAdmin || user?.role === 'IT' || canView('vehicles')) && (
          <div className={`nav-item ${isActive('/vehicles') ? 'active' : ''}`} onClick={() => { navigate('/vehicles'); onClose(); }} title="Vehicle Management">
            <Car size={20} />
            <span className="nav-text">Vehicle Management</span>
          </div>
        )}

        {!isGuard && !isAccounting && (isAdmin || user?.role === 'IT' || canView('users')) && (
          <div className={`nav-item ${isActive('/users') ? 'active' : ''}`} onClick={() => { navigate('/users'); onClose(); }} title="User Management">
            <Users size={20} />
            <span className="nav-text">User Management</span>
          </div>
        )}

      </nav>


      <style>{`
        .glass-sidebar {
            width: 260px;
            height: 100vh;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--sidebar-border);
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
            transition: width 0.2s ease, background 0.3s ease, border-color 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .glass-sidebar.collapsed {
            width: 72px;
        }

        .glass-sidebar.collapsed .nav-item,
        .glass-sidebar.collapsed .sub-item {
            justify-content: center;
            padding: 0.6rem 0;
        }

        .glass-sidebar.collapsed .nav-text,
        .glass-sidebar.collapsed .chevron-icon,
        .glass-sidebar.collapsed .user-details {
            display: none;
        }
        
        .glass-sidebar.collapsed .sidebar-footer .logout-btn {
            justify-content: center;
            padding: 0.5rem;
        }

        @media (max-width: 1024px) {
          .glass-sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
            box-shadow: ${isOpen ? '4px 0 24px rgba(0,0,0,0.08)' : 'none'};
          }
        }

        .sidebar-header { 
          padding: 1.25rem 1.25rem 1rem; 
          border-bottom: 1px solid var(--sidebar-border); 
        }
        .logo { display: flex; align-items: center; justify-content: center; }

        .sidebar-nav { 
          flex: 1; 
          padding: 0.75rem 0.75rem; 
          display: flex; 
          flex-direction: column; 
          gap: 2px; 
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.08) transparent;
        }
        
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }

        .nav-item {
            padding: 0.55rem 0.75rem;
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: flex;
            align-items: center; 
            gap: 10px;
            color: var(--sidebar-text);
            font-weight: 500;
            font-size: 0.875rem;
            transition: background 0.15s ease, color 0.15s ease;
            position: relative;
        }

        .nav-item:hover { 
            background: var(--sidebar-item-hover); 
            color: var(--text-main);
        }

        .nav-item.active { 
            background: var(--sidebar-item-active-bg); 
            color: var(--sidebar-item-active-text); 
            font-weight: 600;
        }

        .chevron-icon { 
          margin-left: auto; 
          transition: transform 0.2s ease; 
          opacity: 0.5; 
          flex-shrink: 0;
        }
        .chevron-icon.open { transform: rotate(180deg); opacity: 1; }

        .sub-nav { 
            padding-left: 0.75rem; 
            display: flex; 
            flex-direction: column; 
            gap: 1px; 
            margin: 2px 0 4px 1.25rem;
            border-left: 1px solid var(--sidebar-border);
        }

        .sub-item {
            padding: 0.45rem 0.75rem;
            border-radius: var(--radius-sm);
            cursor: pointer;
            color: var(--sidebar-text);
            font-size: 0.85rem;
            font-weight: 500;
            transition: background 0.15s ease, color 0.15s ease;
        }

        .sub-item:hover { color: var(--text-main); background: var(--sidebar-item-hover); }
        .sub-item.active { 
            color: var(--sidebar-item-active-text); 
            font-weight: 600; 
            background: var(--sidebar-item-active-bg);
        }

        .sidebar-footer { 
          padding: 0.75rem; 
          border-top: 1px solid var(--sidebar-border); 
          margin-top: auto; 
        }
        .user-info { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          margin-bottom: 0.5rem; 
          padding: 0.5rem; 
          border-radius: var(--radius-sm); 
          transition: background 0.15s ease; 
          cursor: pointer;
        }
        .user-info:hover { background: var(--sidebar-item-hover); }
        
        .user-avatar { 
            width: 32px; height: 32px; border-radius: var(--radius-sm); 
            background: var(--accent-indigo);
            display: flex; align-items: center; justify-content: center;
            font-weight: 600; color: white; font-size: 0.8rem;
            flex-shrink: 0;
        }
        
        .user-details { overflow: hidden; }
        .user-name { font-weight: 600; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        .user-email { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

        .logout-btn {
            width: 100%; padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border);
            background: transparent; color: var(--text-dim); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            font-weight: 500; font-size: 0.85rem; transition: var(--transition-smooth);
            font-family: inherit;
        }
        .logout-btn:hover { background: var(--danger-light); color: var(--danger); border-color: transparent; }

        .clickable-profile { cursor: pointer; }

        @media print {
            .glass-sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
