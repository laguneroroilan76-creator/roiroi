import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-header">
        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p>{isLogin ? 'Login to access your dashboard' : 'Join us today'}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Juan Dela Cruz" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="text" 
            placeholder="Username or Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
            {isLogin ? ' Register' : ' Login'}
          </span>
        </p>
      </div>
    </div>
  );
}
