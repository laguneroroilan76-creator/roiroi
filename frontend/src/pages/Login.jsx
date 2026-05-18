import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-section">
          <form onSubmit={handleSubmit} className="login-form">
            <div style={{ height: '1rem' }}></div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="text"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="separator">
              <span>Or continue with</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="social-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
                  <path fill="#f25022" d="M0 0h10v10H0z"/>
                  <path fill="#7fba00" d="M11 0h10v10H11z"/>
                  <path fill="#00a4ef" d="M0 11h10v10H0z"/>
                  <path fill="#ffb900" d="M11 11h10v10H11z"/>
                </svg>
                <span style={{ fontWeight: 600 }}>Outlook</span>
              </button>
            </div>

          </form>
        </div>

        <div className="login-image-section">
          <img src="/HDI Primary Logo .png" alt="HDI Logo" className="right-side-logo" />
        </div>
      </div>


      <style>{`
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #64748b;
          padding: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .login-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 900px;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        @media (min-width: 768px) {
          .login-card {
            flex-direction: row;
          }
        }

        .login-form-section {
          flex: 1;
          padding: 2rem;
        }

        @media (min-width: 768px) {
          .login-form-section {
            padding: 3rem;
          }
        }

        .login-image-section {
          display: none;
          flex: 1;
          background: #f8fafc;
          position: relative;
        }

        @media (min-width: 768px) {
          .login-image-section {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .right-side-logo {
          width: 50%;
          max-width: 300px;
          height: auto;
          object-fit: contain;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 400px;
          margin: 0 auto;
        }



        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #0f172a;
        }

        .password-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .forgot-link {
          font-size: 0.875rem;
          color: #0f172a;
          text-decoration: none;
        }
        .forgot-link:hover {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .form-group input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          outline: none;
          color: #0f172a;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .form-group input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 1px #0f172a;
        }

        .submit-btn {
          width: 100%;
          background: #0f172a;
          color: white;
          border: none;
          padding: 0.625rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1e293b;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .separator {
          position: relative;
          text-align: center;
          margin: 1rem 0;
        }

        .separator::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
          z-index: 1;
        }

        .separator span {
          position: relative;
          z-index: 2;
          background: white;
          padding: 0 0.5rem;
          color: #64748b;
          font-size: 0.75rem;
        }

        .social-buttons {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          color: #0f172a;
          transition: background 0.2s;
        }

        .social-btn:hover {
          background: #f8fafc;
        }

        .social-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }



        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
          background: #fef2f2;
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #fee2e2;
        }
      `}</style>
    </div>
  );
}
