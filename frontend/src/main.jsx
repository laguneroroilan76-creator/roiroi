import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import './index.css'

// Safe LocalStorage Polyfill for Incognito/Private modes where storage is blocked
try {
  const testKey = '__test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('LocalStorage is blocked (likely Incognito mode). Using in-memory fallback.');
  const memStorage = {};
  const mockStorage = {
    getItem: (key) => (key in memStorage ? memStorage[key] : null),
    setItem: (key, val) => { memStorage[key] = String(val); },
    removeItem: (key) => { delete memStorage[key]; },
    clear: () => { Object.keys(memStorage).forEach(k => delete memStorage[k]); },
    key: (i) => Object.keys(memStorage)[i] || null,
    get length() { return Object.keys(memStorage).length; }
  };
  
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
      enumerable: true,
      writable: false
    });
  } catch (overrideError) {
    console.error('Failed to polyfill localStorage:', overrideError);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
