import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Button } from '@headlessui/react';


const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmData({ message, resolve });
    });
  }, []);

  const handleConfirm = useCallback((value) => {
    if (confirmData) {
      confirmData.resolve(value);
      setConfirmData(null);
    }
  }, [confirmData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!confirmData) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmData, handleConfirm]);

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}
      
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <XCircle size={18} /> : <Info size={18} />} 
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={!!confirmData} as="div" onClose={() => handleConfirm(false)} style={{ position: 'relative', zIndex: 9999 }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <DialogPanel
              transition="true"
              style={{
                width: '100%', maxWidth: '28rem', borderRadius: '16px', background: 'var(--card-bg)', padding: '1.5rem',
                boxShadow: 'var(--card-shadow)', border: '1px solid var(--glass-border)',
                transitionDuration: '300ms', transitionTimingFunction: 'ease-out'
              }}
            >
              <DialogTitle as="h3" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, marginBottom: '0.5rem' }}>
                Action Required
              </DialogTitle>
              <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: '1.5', fontWeight: 500 }}>
                {confirmData?.message}
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  style={{ borderRadius: '8px', padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}
                  onClick={() => handleConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  style={{ borderRadius: '8px', padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 700, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  onClick={() => handleConfirm(true)}
                >
                  Confirm Action
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </ToastContext.Provider>
  );
};
