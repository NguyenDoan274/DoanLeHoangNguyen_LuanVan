import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import '../css/AdminCourses.css'; // sharing layout CSS

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminDashboard() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        setError(data.message || 'Lỗi khi tải dữ liệu thống kê.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-content container-max">
      <div className="management-header" style={{ marginBottom: '32px' }}>
        <div className="header-text">
          <h1 className="font-headline-lg" style={{ background: 'linear-gradient(90deg, var(--primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hệ thống Quản trị EduPro
          </h1>
          <p className="font-body-md text-muted">
            Chào mừng trở lại, {user?.full_name || 'Quản trị viên'}. Dưới đây là tóm tắt tình hình vận hành hệ thống hôm nay.
          </p>
        </div>
      </div>

      {error && (
        <div className="ic-alert ic-alert-error animate-fade-in" style={{ marginBottom: '24px' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="ic-loading" style={{ minHeight: '300px' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>sync</span>
          <span>Đang tải số liệu thống kê...</span>
        </div>
      ) : (
        stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Stats Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px'
            }}>
              {/* Users Stat Card */}
              <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group</span>
                </div>
                <div>
                  <p className="font-body-sm text-muted" style={{ margin: 0, fontWeight: 500 }}>Tổng Học Viên</p>
                  <h3 className="font-headline-md" style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.totalUsers}</h3>
                </div>
              </div>

              {/* Courses Stat Card */}
              <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', color: '#059669' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>library_books</span>
                </div>
                <div>
                  <p className="font-body-sm text-muted" style={{ margin: 0, fontWeight: 500 }}>Khóa học Đăng tải</p>
                  <h3 className="font-headline-md" style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.totalCourses}</h3>
                </div>
              </div>

              {/* Orders Stat Card */}
              <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed', color: '#d97706' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>shopping_cart</span>
                </div>
                <div>
                  <p className="font-body-sm text-muted" style={{ margin: 0, fontWeight: 500 }}>Tổng Đơn Hàng</p>
                  <h3 className="font-headline-md" style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.totalOrders}</h3>
                </div>
              </div>

              {/* Revenue Stat Card */}
              <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf2f8', color: '#db2777' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>payments</span>
                </div>
                <div>
                  <p className="font-body-sm text-muted" style={{ margin: 0, fontWeight: 500 }}>Doanh Thu</p>
                  <h3 className="font-headline-md" style={{ margin: '4px 0 0 0', fontWeight: 800, color: 'var(--success, #0f5132)' }}>
                    {parseFloat(stats.totalRevenue).toLocaleString('vi-VN')} đ
                  </h3>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="font-headline-sm" style={{ marginTop: 0, marginBottom: '20px' }}>Lối Tắt Quản Trị Nhanh</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <Link to="/admin/courses" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '12px' }}>
                  <span className="material-symbols-outlined">library_books</span>
                  <span>Khóa Học</span>
                </Link>
                <Link to="/admin/orders" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '12px' }}>
                  <span className="material-symbols-outlined">shopping_cart</span>
                  <span>Đơn Hàng</span>
                </Link>
                <Link to="/admin/payments" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '12px' }}>
                  <span className="material-symbols-outlined">payments</span>
                  <span>Thanh Toán & Doanh Thu</span>
                </Link>
                <Link to="/admin/users" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '12px' }}>
                  <span className="material-symbols-outlined">group</span>
                  <span>Tài Khoản</span>
                </Link>
              </div>
            </div>
          </div>
        )
      )}
    </main>
  );
}
