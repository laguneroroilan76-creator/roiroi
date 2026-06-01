import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api from '../services/api';

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  }); // Desktop sidebar collapse

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Failed to refresh user session:', err);
      }
    };
    refreshUser();
  }, []);
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      {/* Mobile menu toggle is now handled by Topbar, but we keep this for extreme edge cases if needed or remove it */}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
      />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay active no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} key={location.pathname}>
        <Topbar 
          user={user} 
          toggleSidebar={() => {
            if (window.innerWidth <= 1024) {
              setSidebarOpen(true);
            } else {
              const newState = !isSidebarCollapsed;
              setIsSidebarCollapsed(newState);
              localStorage.setItem('sidebarCollapsed', newState);
            }
          }} 
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="content-wrapper">
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-overlay { display: block !important; }
        }
        @media print {
          .sidebar-overlay, .glass-sidebar, .topbar {
            display: none !important;
          }
        }
        .content-wrapper {
          padding: 0.5rem;
          width: 100%;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}
