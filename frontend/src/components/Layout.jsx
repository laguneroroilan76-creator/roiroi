import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <Sidebar />
      <main className="main-content" key={location.pathname}>
        {children}
      </main>
    </div>
  );
}
