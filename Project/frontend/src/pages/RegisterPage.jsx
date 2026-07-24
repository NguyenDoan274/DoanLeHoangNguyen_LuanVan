import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;

    if (!name || !email || !password) {
      setError('Hãy điền đầy đủ các trường thông tin.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Đăng ký thành công!');
        setFormData({ name: '', email: '', password: '' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const firstError = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || data.error || 'Registration failed.';

        setError(firstError);
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Dotted background */}
      <div className="register-bg-pattern" />

      {/* Decorative blobs */}
      <div className="register-blob register-blob-1" />
      <div className="register-blob register-blob-2" />

      <main className="register-main">
        {/* Registration Card */}
        <div className="register-card animate-fade-in-up">
          {/* Brand */}
          <div className="register-brand">
            <Link to="/" className="register-logo font-headline-md">EduPro</Link>
            <h1 className="font-headline-lg">Create Account</h1>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Join our learning community
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="register-error animate-fade-in">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span className="font-body-sm">{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="register-success animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              marginBottom: '20px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10b981' }}>check_circle</span>
              <span className="font-body-sm" style={{ fontWeight: 500 }}>{success}</span>
            </div>
          )}

          {/* Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="register-name" className="form-label font-label-md">
                FULL NAME
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  id="register-name"
                  name="name"
                  className="input-field input-with-icon"
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading || !!success}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="register-email" className="form-label font-label-md">
                EMAIL ADDRESS
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  className="input-field input-with-icon"
                  placeholder="abc@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading || !!success}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="register-password" className="form-label font-label-md">
                PASSWORD
              </label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="register-password"
                  name="password"
                  className="input-field input-with-icon"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  style={{ paddingRight: 48 }}
                  disabled={loading || !!success}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  disabled={loading || !!success}
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
              className="btn btn-primary register-submit-btn"
              disabled={loading || !!success}
              id="register-submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>sync</span>
                  Processing...
                </>
              ) : success ? (
                <>
                  Đang chuyển hướng...
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>sync</span>
                </>
              ) : (
                <>
                  Sign Up
                  <span className="material-symbols-outlined btn-arrow">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="register-footer-link">
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Already have an account?{' '}
              <Link to="/login" className="signin-link" id="register-to-login">Sign In</Link>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="trust-badges">
          <div className="trust-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span>Secure</span>
          </div>
          <div className="trust-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>encrypted</span>
            <span>Encrypted</span>
          </div>
        </div>
      </main>
    </div>
  );
}
