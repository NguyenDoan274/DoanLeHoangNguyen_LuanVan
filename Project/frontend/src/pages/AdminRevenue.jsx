import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('vi-VN') + ' đ';
};

export default function AdminRevenue() {
  const { user } = useOutletContext();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Detail modal
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [instructorDetail, setInstructorDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
        `${API_BASE}/api/admin/revenue/summary?month=${month}&year=${year}`,
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

  const fetchInstructors = async () => {
    setLoadingInstructors(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/revenue/instructors?month=${month}&year=${year}`,
        { headers: authHeaders() }
      );
      const json = await res.json();
      if (res.ok) {
        setInstructors(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi tải danh sách giảng viên.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoadingInstructors(false);
    }
  };

  const fetchInstructorDetail = async (instructorId) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/revenue/instructors/${instructorId}?month=${month}&year=${year}`,
        { headers: authHeaders() }
      );
      const json = await res.json();
      if (res.ok) {
        setInstructorDetail(json.data);
      } else {
        showAlert('error', json.message || 'Lỗi tải chi tiết giảng viên.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchInstructors()]);
      setLoading(false);
    };
    loadData();
  }, [month, year]);

  const handleOpenDetail = (instructor) => {
    setSelectedInstructor(instructor);
    setInstructorDetail(null);
    fetchInstructorDetail(instructor.id);
  };

  const handleCloseDetail = () => {
    setSelectedInstructor(null);
    setInstructorDetail(null);
  };

  const filteredInstructors = instructors.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.full_name || '').toLowerCase().includes(q) ||
      (i.email || '').toLowerCase().includes(q)
    );
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <main className="admin-content container-max">
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`} style={{ marginBottom: 20 }}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Management Header */}
      <div className="management-header">
        <div className="header-text">
          <h1 className="font-headline-lg">Quản lý Doanh Thu</h1>
          <p className="font-body-md text-muted">Tổng quan doanh thu hệ thống, phân tích theo giảng viên và khóa học.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên, email giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm"
            />
          </div>
          <select
            className="status-select font-body-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select
            className="status-select font-body-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      {summary && !loading && (
        <section className="stats-overview" style={{ marginBottom: '32px' }}>
          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng doanh thu tháng {month}/{year}</p>
              <h3 className="stat-value">
                {formatCurrency(summary.totalRevenue)}
              </h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Thu nhập giảng viên (80%)</p>
              <h3 className="stat-value">
                {formatCurrency(summary.instructorRevenue)}
              </h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#d97706' }}>
              <span className="material-symbols-outlined">storefront</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Phí nền tảng (20%)</p>
              <h3 className="stat-value">
                {formatCurrency(summary.platformFee)}
              </h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#ecfeff', color: '#0891b2' }}>
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Giao dịch thành công</p>
              <h3 className="stat-value">{summary.totalTransactions || 0}</h3>
            </div>
          </div>
        </section>
      )}

      {/* Instructors Revenue Table */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải dữ liệu doanh thu...</span>
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>trending_up</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không có dữ liệu doanh thu</h3>
          <p className="font-body-sm text-muted">Chưa có giao dịch thành công nào trong tháng {month}/{year}.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Giảng viên</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Tổng doanh thu</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>GV nhận (80%)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Phí sàn (20%)</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Số GD</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="course-row">
                    <td>
                      <div>
                        <p className="font-body-md" style={{ margin: 0, fontWeight: 600 }}>{instructor.full_name || 'N/A'}</p>
                        <p className="course-updated" style={{ margin: 0 }}>{instructor.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-body-md" style={{ fontWeight: 500 }}>
                        {formatCurrency(instructor.totalRevenue)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-body-md" style={{ fontWeight: 500 }}>
                        {formatCurrency(instructor.instructorRevenue)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-body-sm">
                        {formatCurrency(instructor.platformFee)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="category-badge">{instructor.totalTransactions || 0}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="action-icon-btn"
                        onClick={() => handleOpenDetail(instructor)}
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructor Detail Modal */}
      {selectedInstructor && (
        <div className="ic-modal-overlay animate-fade-in" onClick={handleCloseDetail}>
          <div className="ic-modal card animate-fade-in-up" style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">Chi tiết doanh thu — {selectedInstructor?.full_name || 'Giảng viên'}</h2>
              <button className="ic-modal-close" onClick={handleCloseDetail}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="course-detail-modal-body">
              {loadingDetail ? (
                <div className="ic-loading" style={{ minHeight: '250px' }}>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Đang tải chi tiết...</span>
                </div>
              ) : instructorDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Top Vertical Summary Block */}
                  <div className="detail-sidebar" style={{ width: '100%' }}>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Tổng doanh thu</span>
                      <span className="detail-info-value font-bold" >
                        {formatCurrency(instructorDetail?.totalRevenue)}
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">GV nhận (80%)</span>
                      <span className="detail-info-value font-bold" >
                        {formatCurrency(instructorDetail?.instructorRevenue)}
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Phí sàn (20%)</span>
                      <span className="detail-info-value font-bold" >
                        {formatCurrency(instructorDetail?.platformFee)}
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Số giao dịch</span>
                      <span className="detail-info-value">{instructorDetail?.totalTransactions || 0}</span>
                    </div>
                  </div>

                  {/* Bottom Courses Table */}
                  <div>
                    <h3 className="font-headline-sm" style={{ marginTop: '8px', marginBottom: '12px' }}>
                      Doanh thu theo khóa học — Tháng {month}/{year}
                    </h3>
                    {(!instructorDetail?.courses || instructorDetail.courses.length === 0) ? (
                      <div className="ic-empty" style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <p className="font-body-sm text-muted" style={{ margin: 0 }}>
                          Chưa có doanh thu khóa học nào trong tháng {month}/{year}.
                        </p>
                      </div>
                    ) : (
                      <div className="course-table-wrapper card">
                        <div className="table-responsive">
                          <table className="course-table">
                            <thead>
                              <tr>
                                <th>Khóa học</th>
                                <th style={{ textAlign: 'center' }}>Lượt mua</th>
                                <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
                                <th style={{ textAlign: 'right' }}>GV nhận (80%)</th>
                                <th style={{ textAlign: 'right' }}>Phí sàn (20%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(instructorDetail?.courses || []).map((course) => (
                                <tr key={course?.id || course?.title} className="course-row">
                                  <td>
                                    <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{course?.title || 'N/A'}</span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="category-badge">{course?.purchaseCount || 0}</span>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, }}>
                                    {formatCurrency(course?.totalRevenue)}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatCurrency(course?.instructorRevenue)}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatCurrency(course?.platformFee)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ic-empty" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="font-body-md text-muted">Không tìm thấy dữ liệu doanh thu của giảng viên này.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
