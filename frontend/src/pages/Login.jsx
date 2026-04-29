import { useState } from 'react';
import axios from 'axios';
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
      const response = await axios.post(`http://localhost:5000/api/auth/login`, { email, password });

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
    <div className="login-page-wrapper">
      <div className="login-glass-card">
        <div className="auth-header">
          <div className="auth-logo-box" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/HDI Primary Logo .png" alt="HDI Logo" style={{ width: '180px', height: 'auto' }} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to <span>HDI</span></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Username or Email</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="text"
                placeholder="admin@hdi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Security Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? <div className="spinner-small" /> : (
              <>
                <span>Access Dashboard</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>© 2026 HDI • Internal Portal</p>
        </div>
      </div>

      <style>{`
        .login-page-wrapper {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; 
          background: #f8fafc;
          background: radial-gradient(circle at top left, #ffffff 0%, #f1f5f9 100%);
          padding: 2rem; position: relative; overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Ambient background blobs */
        .login-page-wrapper::before {
          content: ''; position: absolute; top: -15%; right: -10%; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
          filter: blur(80px); animation: float 20s infinite alternate;
        }
        .login-page-wrapper::after {
          content: ''; position: absolute; bottom: -20%; left: -10%; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%);
          filter: blur(100px); animation: float 15s infinite alternate-reverse;
        }

        @keyframes float {
            from { transform: translate(0, 0); }
            to { transform: translate(50px, 50px); }
        }

        .login-glass-card { 
            max-width: 480px; width: 100%; 
            padding: 4rem 3.5rem; 
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 40px;
            z-index: 10;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
            animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .auth-logo-box { 
            width: 70px; height: 70px; 
            background: rgba(255, 255, 255, 0.05); 
            border-radius: 20px; 
            display: flex; align-items: center; justify-content: center; 
            margin: 0 auto 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo-icon { font-size: 2.5rem; filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.5)); }

        .auth-header { text-align: center; margin-bottom: 3rem; }
        .auth-header h1 { font-size: 3rem; font-weight: 800; color: #0f172a; letter-spacing: -2px; margin-bottom: 0.5rem; }
        .auth-header p { font-size: 1.1rem; color: #64748b; font-weight: 500; }
        .auth-header p span { color: #4f46e5; font-weight: 700; }

        .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .input-group { display: flex; flex-direction: column; gap: 0.7rem; }
        .input-group label { font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; padding-left: 4px; }
        
        .input-wrapper { 
            position: relative; 
            display: flex; align-items: center;
        }
        .input-icon { position: absolute; left: 18px; font-size: 1.1rem; opacity: 0.5; }

        .input-group input { 
            width: 100%; 
            padding: 1.2rem 1.2rem 1.2rem 3.2rem;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            color: #1e293b;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.3s;
        }
        .input-group input:focus { 
            background: white;
            border-color: #6366f1;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
            outline: none;
        }

        .error-banner {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #f87171;
            padding: 1rem;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: 600;
            display: flex; align-items: center; gap: 10px;
            animation: shake 0.4s ease-in-out;
        }

        .login-submit-btn {
            margin-top: 1rem;
            padding: 1.2rem;
            border-radius: 18px;
            border: none;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 12px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
        .login-submit-btn:hover:not(:disabled) { 
            transform: translateY(-3px);
            box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5);
            filter: brightness(1.1);
        }
        .login-submit-btn:active:not(:disabled) { transform: translateY(1px); }
        .login-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.5); }
        
        .btn-arrow { font-size: 1.2rem; transition: transform 0.3s; }
        .login-submit-btn:hover .btn-arrow { transform: translateX(5px); }

        .auth-footer { text-align: center; margin-top: 3rem; }
        .auth-footer p { font-size: 0.8rem; color: #475569; font-weight: 500; }

        .spinner-small { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
        }

        @media (max-width: 480px) {
            .login-glass-card { padding: 3rem 2rem; border-radius: 30px; }
            .auth-header h1 { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
}
