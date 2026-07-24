import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email || !password) {
    setError('Hãy điền đầy đủ các trường thông tin.');
    return;
  }
  setError('');
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      
      localStorage.setItem('access_token', data.access_token);
      
      if (data.user && data.user.role) {
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        
        window.dispatchEvent(new Event('storage'));

        
        if (data.user.role === 'STUDENT') {
          navigate('/');
        } else if (data.user.role === 'INSTRUCTOR') {
          navigate('/instructor');
        } else if (data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } else {
      setError(data.message || data.error || 'Sai thông tin tài khoản hoặc mật khẩu.');
    }
  } catch {
    setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-page">
      {/* Dotted background */}
      <div className="login-bg-pattern" />

      {/* Decorative blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <main className="login-main">
        <div className="login-card animate-fade-in-up">
          {/* Brand */}
          <div className="login-brand">
            <Link to="/" className="login-logo font-headline-md">EduPro</Link>
            <div className="login-brand-text">
              <h1 className="font-headline-lg">Welcome Back</h1>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="login-error animate-fade-in">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span className="font-body-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label font-label-md">
                EMAIL ADDRESS
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  id="login-email"
                  className="input-field input-with-icon"
                  placeholder="abc@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label font-label-md">
                  PASSWORD
                </label>
                {/* <a href="#" className="forgot-link font-label-md">Forgot password?</a> */}
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="input-field input-with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>sync</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="login-footer-link">
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="signup-link" id="login-to-register">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}