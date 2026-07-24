import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import '../css/AdminLayout.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const userStr = localStorage.getItem('user');

    if (!token || role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse admin user:", e);
      }
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="ic-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>sync</span>
        <span>Validating admin session...</span>
      </div>
    );
  }

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`)
    : defaultAvatar;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-dashboard-wrapper">
      {/* Side NavBar */}
      <nav className="admin-sidenav animate-fade-in">
        <div className="sidenav-brand">
          <div className="brand-logo-wrapper">
            <span className="material-symbols-outlined text-white">school</span>
          </div>
          <div>
            <h2 className="font-headline-sm">EduPro</h2>
            <p className="sidenav-role">Admin Console</p>
          </div>
        </div>

        <div className="sidenav-links">
          <Link to="/admin" className={`sidenav-link-item ${isActive('/admin') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md">Tổng quan</span>
          </Link>
          <Link to="/admin/courses" className={`sidenav-link-item ${isActive('/admin/courses') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">library_books</span>
            <span className="font-label-md">Quản lý khóa học</span>
          </Link>
          <Link to="/admin/categories" className={`sidenav-link-item ${isActive('/admin/categories') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">category</span>
            <span className="font-label-md">Quản lý danh mục</span>
          </Link>
          <Link to="/admin/users" className={`sidenav-link-item ${isActive('/admin/users') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-md">Quản lý người dùng</span>
          </Link>
          <Link to="/admin/coupons" className={`sidenav-link-item ${isActive('/admin/coupons') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">confirmation_number</span>
            <span className="font-label-md">Quản lý mã giảm giá</span>
          </Link>
          <Link to="/admin/promotions" className={`sidenav-link-item ${isActive('/admin/promotions') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">percent</span>
            <span className="font-label-md">Quản lý chương trình khuyến mãi</span>
          </Link>
          <Link to="/admin/orders" className={`sidenav-link-item ${isActive('/admin/orders') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="font-label-md">Quản lý đơn hàng</span>
          </Link>
          <Link to="/admin/payments" className={`sidenav-link-item ${isActive('/admin/payments') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-label-md">Quản lý thanh toán</span>
          </Link>
          <Link to="/admin/enrollments" className={`sidenav-link-item ${isActive('/admin/enrollments') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-md">Quản lý đăng ký học</span>
          </Link>
          <Link to="/admin/profile" className={`sidenav-link-item ${isActive('/admin/profile') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md">Tài khoản</span>
          </Link>
        </div>

        <div className="sidenav-footer">
          <button onClick={handleLogout} className="sidenav-link-item logout-btn" style={{ width: '100%', border: 'none', background: 'none' }}>
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <div className="admin-main">
        {/* TopNavBar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <span className="font-headline-md text-primary">EduPro</span>
            <span className="topbar-subtitle font-body-sm text-muted" style={{ marginLeft: 16 }}>
              {isActive('/admin') && 'Quản lý khóa học'}
              {isActive('/admin/categories') && 'Quản lý danh mục'}
              {isActive('/admin/users') && 'Quản lý người dùng'}
              {isActive('/admin/coupons') && 'Quản lý mã giảm giá'}
              {isActive('/admin/promotions') && 'Quản lý chương trình khuyến mãi'}
              {isActive('/admin/profile') && 'Tài khoản'}
            </span>
          </div>

          <div className="topbar-right">
            <div className="topbar-actions">
              <button className="icon-btn"><span className="material-symbols-outlined">notifications</span></button>
            </div>
            <div className="topbar-profile">
              <div className="profile-text">
                <p className="profile-name">{user?.full_name || 'Admin'}</p>
                <p className="profile-role">Admin</p>
              </div>
              <Link to="/admin/profile">
                <img src={avatarUrl} alt="Avatar" className="profile-avatar" onError={(e) => { e.target.src = defaultAvatar; }} />
              </Link>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}
