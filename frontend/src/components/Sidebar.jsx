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
  Users 
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

        {!isGuard && canView('support') && (
          <div className={`nav-item ${isActive('/support') ? 'active' : ''}`} onClick={() => { navigate('/support'); onClose(); }} title="Support Log">
            <MessageSquare size={20} />
            <span className="nav-text">Support Log</span>
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('archived') && (
          <div className={`nav-item ${isActive('/archived') || (['/trip-ticket', '/prf', '/rfp'].includes(location.pathname) && location.state?.isArchived) ? 'active' : ''}`} onClick={() => { navigate('/archived'); onClose(); }} title="Archived Records">
            <Archive size={20} />
            <span className="nav-text">Archived Records</span>
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('vehicles') && (
          <div className={`nav-item ${isActive('/vehicles') ? 'active' : ''}`} onClick={() => { navigate('/vehicles'); onClose(); }} title="Vehicle Management">
            <Car size={20} />
            <span className="nav-text">Vehicle Management</span>
          </div>
        )}

        {isAdmin && !isGuard && !isAccounting && canView('users') && (
          <div className={`nav-item ${isActive('/users') ? 'active' : ''}`} onClick={() => { navigate('/users'); onClose(); }} title="User Management">
            <Users size={20} />
            <span className="nav-text">User Management</span>
          </div>
        )}


      </nav>

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

        .glass-sidebar.collapsed {
            width: 80px;
        }

        .glass-sidebar.collapsed .nav-item,
        .glass-sidebar.collapsed .sub-item {
            justify-content: center;
            padding: 0.8rem 0;
        }

        .glass-sidebar.collapsed .nav-text {
            display: none;
        }
        
        .glass-sidebar.collapsed .nav-item span.chevron {
            display: none;
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

        body[data-theme='dark'] .glass-sidebar { background: #0f172a; border-right: 1px solid #1e293b; }
        body[data-theme='dark'] .sidebar-header, body[data-theme='dark'] .sidebar-footer { border-color: #1e293b; }
        body[data-theme='dark'] .nav-item { color: #94a3b8; }
        body[data-theme='dark'] .nav-item:hover { background: #1e293b; color: white; }
        body[data-theme='dark'] .nav-item.active { background: white; color: #0f172a; }
        body[data-theme='dark'] .sub-nav { border-color: #1e293b; }
        body[data-theme='dark'] .sub-item { color: #94a3b8; }
        body[data-theme='dark'] .sub-item:hover { background: #1e293b; color: white; }
        body[data-theme='dark'] .sub-item.active { background: #1e293b; color: white; }
        body[data-theme='dark'] .user-info:hover { background: #1e293b; }
        body[data-theme='dark'] .user-name { color: white; }
        body[data-theme='dark'] .user-avatar { background: white; color: #0f172a; }
        body[data-theme='dark'] .logout-btn { background: #0f172a; color: white; border-color: #1e293b; }
        body[data-theme='dark'] .logout-btn:hover { background: #1e293b; }
      `}</style>
    </aside>
  );
}
