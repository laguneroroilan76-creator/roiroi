import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      {/* Hamburger Menu - Only visible on mobile */}
      <button 
        className="mobile-menu-toggle no-print"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1.5rem',
          left: '1.5rem',
          zIndex: 2001,
          width: '45px',
          height: '45px',
          borderRadius: '12px',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          display: 'none', // Managed by CSS media query
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.3)'
        }}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay no-print"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'none' // Managed by CSS
          }}
        />
      )}

      <main className="main-content" key={location.pathname}>
        {children}
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-menu-toggle { display: flex !important; }
          .sidebar-overlay { display: block !important; }
          .main-content { padding-top: 5rem !important; }
        }
        @media print {
          .mobile-menu-toggle, .sidebar-overlay, .glass-sidebar {
            display: none !important;
          }
          .main-content {
            padding-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
