import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import '../css/InstructorLayout.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const userStr = localStorage.getItem('user');

    if (!token || role !== 'INSTRUCTOR') {
      navigate('/login');
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse user:", e);
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
        <span>Validating instructor session...</span>
      </div>
    );
  }

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`)
    : defaultAvatar;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="instructor-dashboard-wrapper">
      {/* Sidebar */}
      <aside className="instructor-sidebar animate-fade-in">
        <div className="sidebar-brand">
          <h1 className="font-headline-md text-primary">EduPro</h1>
          <p className="sidebar-sub">Instructor Portal</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/instructor" className={`sidebar-nav-item ${isActive('/instructor') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Tổng Quan</span>
          </Link>
          <Link to="/instructor/courses" className={`sidebar-nav-item ${isActive('/instructor/courses') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">auto_stories</span>
            <span>Khóa Học Của Tôi</span>
          </Link>
          <Link to="/instructor/course-groups" className={`sidebar-nav-item ${isActive('/instructor/course-groups') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">workspaces</span>
            <span>Nhóm Khóa Học</span>
          </Link>
          <Link to="/instructor/students" className={`sidebar-nav-item ${isActive('/instructor/students') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">group</span>
            <span>Học Viên</span>
          </Link>
          <Link to="/instructor/revenue" className={`sidebar-nav-item ${isActive('/instructor/revenue') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">trending_up</span>
            <span>Doanh Thu</span>
          </Link>
          <Link to="/instructor/profile" className={`sidebar-nav-item ${isActive('/instructor/profile') ? 'active' : ''}`}>
            <span className="material-symbols-outlined">settings</span>
            <span>Tài Khoản</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-nav-item logout-btn" style={{ width: '100%' }}>
            <span className="material-symbols-outlined">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="instructor-main">
        {/* Top App Bar */}
        <header className="instructor-topbar">
          <div className="topbar-left">
            <h2 className="font-headline-sm">
              {isActive('/instructor') && 'Tổng Quan'}
              {location.pathname === '/instructor/courses' && 'Khóa học của tôi'}
              {location.pathname.includes('/chapters') && 'Quản lý chương học'}
              {location.pathname.includes('/lessons') && 'Quản lý bài học'}
              {isActive('/instructor/course-groups') && 'Nhóm khóa học'}
              {isActive('/instructor/students') && 'Học Viên'}
              {isActive('/instructor/revenue') && 'Doanh Thu'}
              {isActive('/instructor/profile') && 'Tài Khoản'}
            </h2>
          </div>
          <div className="topbar-right">
            <div className="topbar-actions">
              <button className="icon-btn"><span className="material-symbols-outlined">notifications</span></button>
              <div className="topbar-user-profile">
                <div className="user-text">
                  <p className="user-name">{user?.full_name || 'Instructor'}</p>
                  <p className="user-role">Giảng viên</p>
                </div>
                <Link to="/instructor/profile">
                  <img src={avatarUrl} alt="Avatar" className="user-avatar" onError={(e) => { e.target.src = defaultAvatar; }} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <Outlet context={{ user }} />

        <footer className="dashboard-footer">
          <p>
            © 2026 EduPro. Mọi thắc mắc vui lòng liên hệ:
            <a href="mailto:dlhnguyen26@gmail.com"> dlhnguyen26 @gmail.com</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
