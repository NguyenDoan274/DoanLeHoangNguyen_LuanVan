import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Header({ searchQuery = '', setSearchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    navigate(localSearch.trim() ? `/courses?q=${encodeURIComponent(localSearch.trim())}` : '/courses');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadUser = () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    const handleStorageChange = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`)
    : defaultAvatar;

  return (
    <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner container-max">
        <div className="header-left">
          {user && user.role === 'INSTRUCTOR' ? (
            <Link to="/instructor" className="brand-logo font-headline-md">EduPro</Link>
          )
          : user && user.role === 'ADMIN' ? (
            <Link to="/admin" className="brand-logo font-headline-md">EduPro</Link>
          ) : (
            <Link to="/" className="brand-logo font-headline-md">EduPro</Link>
          )}
          
            <nav className="header-nav">
              <Link to="/courses">Danh sách khóa học</Link>
              <Link to="/my-courses">Khóa học của bạn</Link>
            </nav>
        </div>

        <div className="header-search">
          <span 
            className="material-symbols-outlined search-icon" 
            onClick={handleSearchSubmit} 
            style={{ cursor: 'pointer' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            className="font-body-sm"
            value={localSearch}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSearch(val);
              if (setSearchQuery) {
                setSearchQuery(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
          />
        </div>

        {user && user.role === 'STUDENT' && (
          <Link to="/order-history" className="header-order-history-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--on-surface-variant)', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
            <span>Lịch sử đơn hàng</span>
          </Link>
        )}

        <div className="header-actions">

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link to="/profile" className="header-avatar-link">
                <img
                  src={avatarUrl}
                  alt={user.full_name || 'User Avatar'}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  className="hover-scale"
                  onError={(e) => { e.target.src = defaultAvatar; }}
                />
              </Link>
              <button onClick={handleLogout} className="btn-ghost btn-sm" id="header-logout">
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm" id="header-sign-in">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="header-join-free">Đăng ký</Link>
            </>
          )}
        </div>
        
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <nav className="mobile-nav">
            <Link to="/courses" onClick={() => setMobileMenuOpen(false)}>Danh sách khóa học</Link>
            <Link to="/my-courses" onClick={() => setMobileMenuOpen(false)}>Khóa học của bạn</Link>
            {user && user.role === 'STUDENT' && (
              <Link to="/order-history" onClick={() => setMobileMenuOpen(false)}>Lịch sử đơn hàng</Link>
            )}
          </nav>
          <div className="mobile-actions">
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <Link to="/profile" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                  Hồ sơ cá nhân
                </Link>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>Join for Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
