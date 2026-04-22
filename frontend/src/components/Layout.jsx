import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
