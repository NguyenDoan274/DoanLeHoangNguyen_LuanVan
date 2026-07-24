import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import '../css/InstructorDashboard.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function InstructorDashboard() {
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
      const res = await fetch(`${API_BASE}/api/instructor/stats`, {
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

  if (loading) {
    return (
      <div className="dashboard-content container-max">
        <div className="ic-loading" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}>sync</span>
          <span>Đang tải số liệu thống kê giảng viên...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content container-max">
        <div className="ic-alert ic-alert-error animate-fade-in" style={{ margin: '24px 0' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content container-max">
      {/* Analytics Cards */}
      <section className="analytics-grid">
        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon-wrapper bg-blue">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <p className="stat-label">Tổng học viên đăng ký</p>
          <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>{stats?.totalStudents.toLocaleString('vi-VN')}</h3>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon-wrapper bg-green">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
          </div>
          <p className="stat-label">Khóa học hoạt động</p>
          <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>
            {stats?.activeCourses}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--outline)' }}>
              / {stats?.totalCourses} tổng
            </span>
          </h3>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon-wrapper bg-red">
              <span className="material-symbols-outlined">fact_check</span>
            </div>
          </div>
          <p className="stat-label">Tổng bài học đăng tải</p>
          <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>{stats?.totalLessons.toLocaleString('vi-VN')}</h3>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon-wrapper bg-yellow">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="stat-label">Tổng doanh thu</p>
          <h3 className="font-headline-lg" style={{ fontWeight: 800, color: 'var(--success, #0f5132)' }}>
            {parseFloat(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ
          </h3>
        </div>
      </section>

      {/* Bento Grid layout */}
      <div className="bento-layout">
        <div className="bento-main">
          {/* Quick Actions */}
          <div className="quick-actions-panel card">
            <h4 className="font-headline-sm" style={{ marginTop: 0, marginBottom: '20px' }}>Thao tác nhanh</h4>
            <div className="quick-actions-grid">
              <Link to="/instructor/courses" className="quick-action-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-label-md">Tạo khóa học mới</span>
              </Link>
              <Link to="/instructor/students" className="quick-action-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="material-symbols-outlined">assessment</span>
                <span className="font-label-md">Báo cáo học viên</span>
              </Link>
              <Link to="/profile" className="quick-action-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="material-symbols-outlined">account_circle</span>
                <span className="font-label-md">Quản lý Tài Khoản</span>
              </Link>
            </div>
          </div>

          {/* Instructor Courses statistics */}
          <div className="pending-reviews-panel card">
            <div className="panel-header">
              <h4 className="font-headline-sm" style={{ margin: 0 }}>Thống kê khóa học của tôi</h4>
              <Link to="/instructor/courses" className="panel-link">XEM TẤT CẢ ({stats?.totalCourses})</Link>
            </div>
            <div className="table-responsive">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th>Trạng thái</th>
                    <th>Giá</th>
                    <th>Học viên</th>
                    <th style={{ textAlign: 'right' }}>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.courseStats.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--outline)', padding: '24px' }}>
                        Chưa có khóa học nào được đăng tải.
                      </td>
                    </tr>
                  ) : (
                    stats?.courseStats.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{course.title}</div>
                        </td>
                        <td>
                          <span 
                            className="stat-badge" 
                            style={{ 
                              color: course.status === 'PUBLISHED' ? '#006c49' : course.status === 'DRAFT' ? '#555' : '#b3261e', 
                              backgroundColor: course.status === 'PUBLISHED' ? 'rgba(0, 108, 73, 0.1)' : course.status === 'DRAFT' ? 'rgba(0,0,0,0.05)' : 'var(--error-container)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            {course.status === 'PUBLISHED' ? 'Hoạt động' : course.status === 'DRAFT' ? 'Bản nháp' : 'Đang ẩn'}
                          </span>
                        </td>
                        <td>
                          {course.price === 0 ? (
                            <span style={{ color: '#006c49', fontWeight: 600 }}>Miễn phí</span>
                          ) : (
                            `${course.price.toLocaleString('vi-VN')} đ`
                          )}
                        </td>
                        <td>{course.studentCount} học viên</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success, #0f5132)' }}>
                          {course.revenue.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar activities */}
        <aside className="recent-activity-panel card">
          <div className="panel-header">
            <h4 className="font-headline-sm" style={{ margin: 0 }}>Lượt đăng ký mới nhất</h4>
            <span className="material-symbols-outlined text-muted">history</span>
          </div>
          <div className="activity-timeline">
            {stats?.recentEnrollments.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '24px 0' }}>
                Chưa có lượt đăng ký học nào.
              </div>
            ) : (
              stats?.recentEnrollments.map((enrollment) => (
                <div className="timeline-item" key={enrollment.id}>
                  <div className="timeline-icon bg-blue" style={{ backgroundColor: 'rgba(0, 40, 142, 0.1)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-text" style={{ margin: 0 }}>
                      <strong>{enrollment.users.full_name}</strong> đã đăng ký khóa học{' '}
                      <span className="text-primary" style={{ fontWeight: 600 }}>{enrollment.courses.title}</span>
                    </p>
                    <span className="timeline-time">{formatRelativeTime(enrollment.enrolled_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
