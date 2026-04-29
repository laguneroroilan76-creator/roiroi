import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmData && (
        <div className="confirm-overlay">
          <div className="confirm-modal premium-card">
            <h3>Action Required</h3>
            <p>{confirmData.message}</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => handleConfirm(false)}>Cancel</button>
              <button className="confirm-btn ok" onClick={() => handleConfirm(true)}>Confirm Action</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
