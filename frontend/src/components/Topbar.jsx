import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, User, LogOut, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Topbar.css';

export default function Topbar({ user, toggleSidebar, isSidebarCollapsed }) {
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.body.setAttribute('data-theme', 'dark');
    }
    
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const avatarContent = user?.avatarUrl ? (
    <img 
      src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${window.location.protocol}//${window.location.hostname}:5000${user.avatarUrl}`} 
      alt="Avatar" 
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
    />
  ) : userInitials;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="collapse-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Dark Mode">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className="bell-container">
          <NotificationBell user={user} />
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <div className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="user-avatar">{avatarContent}</div>
            <div className="user-info-mini">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Guest'}</span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                <User size={16} /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                <Settings size={16} /> Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
