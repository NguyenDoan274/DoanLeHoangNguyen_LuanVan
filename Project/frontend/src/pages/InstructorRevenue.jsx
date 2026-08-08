import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/InstructorDashboard.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorRevenue() {
  const { user } = useOutletContext();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/instructor/revenue/summary?month=${month}&year=${year}`,
        { headers: authHeaders() }
      );
      const json = await res.json();
      if (res.ok) {
        setSummary(json.data);
      } else {
        showAlert('error', json.message || 'Lỗi tải thống kê doanh thu.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/instructor/revenue/courses?month=${month}&year=${year}`,
        { headers: authHeaders() }
      );
      const json = await res.json();
      if (res.ok) {
        setCourses(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi tải doanh thu khóa học.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchCourses()]);
      setLoading(false);
    };
    loadData();
  }, [month, year]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const totalCourseRevenue = courses.reduce((sum, c) => sum + Number(c.totalRevenue || 0), 0);
  const totalPurchases = courses.reduce((sum, c) => sum + (c.purchaseCount || 0), 0);

  if (loading) {
    return (
      <div className="dashboard-content container-max">
        <div className="ic-loading" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}>sync</span>
          <span>Đang tải dữ liệu doanh thu...</span>
        </div>
      </div>
    );
  }

  if (alert.type === 'error' && !summary) {
    return (
      <div className="dashboard-content container-max">
        <div className="ic-alert ic-alert-error animate-fade-in" style={{ margin: '24px 0' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{alert.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content container-max">
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`} style={{ marginBottom: 20 }}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Analytics Cards */}
      {summary && (
        <section className="analytics-grid">
          <div className="stat-card card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-green">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
            </div>
            <p className="stat-label">Tổng doanh thu tháng {month}/{year}</p>
            <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>
              {parseFloat(summary.totalRevenue || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-blue">
                <span className="material-symbols-outlined">savings</span>
              </div>
            </div>
            <p className="stat-label">Thu nhập của tôi (80%)</p>
            <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>
              {parseFloat(summary.instructorRevenue || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-yellow">
                <span className="material-symbols-outlined">storefront</span>
              </div>
            </div>
            <p className="stat-label">Phí nền tảng (20%)</p>
            <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>
              {parseFloat(summary.platformFee || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-red">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
            </div>
            <p className="stat-label">Giao dịch thành công</p>
            <h3 className="font-headline-lg" style={{ fontWeight: 800 }}>{summary.totalTransactions}</h3>
          </div>
        </section>
      )}

      {/* Full-width content section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
        {/* Month/Year Filter */}
        <div className="quick-actions-panel card">
          <h4 className="font-headline-sm" style={{ marginTop: 0, marginBottom: '16px' }}>Bộ lọc thời gian</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>calendar_month</span>
            <select
              style={{
                height: '40px', padding: '0 12px', backgroundColor: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', fontSize: '14px'
              }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              style={{
                height: '40px', padding: '0 12px', backgroundColor: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', fontSize: '14px'
              }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Revenue Table */}
        <div className="pending-reviews-panel card">
          <div className="panel-header">
            <h4 className="font-headline-sm" style={{ margin: 0 }}>Doanh thu theo khóa học</h4>
            <span className="font-body-sm text-muted">{courses.length} khóa học</span>
          </div>
          {loadingCourses ? (
            <div className="ic-loading" style={{ padding: '40px' }}>
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span>Đang tải...</span>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '24px' }}>
              Chưa có giao dịch thành công nào trong tháng {month}/{year}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th style={{ textAlign: 'center' }}>Lượt mua</th>
                    <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
                    <th style={{ textAlign: 'right' }}>Thu nhập (80%)</th>
                    <th style={{ textAlign: 'right' }}>Phí sàn (20%)</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{course.title}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="stat-badge"
                          style={{
                            color: '#006c49',
                            backgroundColor: 'rgba(0, 108, 73, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {course.purchaseCount}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700}}>
                        {parseFloat(course.totalRevenue).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {parseFloat(course.instructorRevenue).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--on-surface-variant)' }}>
                        {parseFloat(course.platformFee).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ borderTop: '2px solid var(--outline-variant)' }}>
                    <td style={{ fontWeight: 700 }}>Tổng cộng</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalPurchases}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700}}>
                      {totalCourseRevenue.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {Math.round(totalCourseRevenue * 0.8).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                      {Math.round(totalCourseRevenue * 0.2).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
