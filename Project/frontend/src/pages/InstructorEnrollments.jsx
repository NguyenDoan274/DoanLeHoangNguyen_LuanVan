import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorEnrollments() {
  const { user } = useOutletContext();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/enrollments`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        const data = json.data || [];
        setEnrollments(data);
        // Extract unique courses
        const courseMap = new Map();
        data.forEach(e => {
          if (e.courses?.id) courseMap.set(e.courses.id, e.courses.title);
        });
        setCourses(Array.from(courseMap.entries()));
      } else {
        showAlert('error', json.message || 'Lỗi tải danh sách học viên.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const studentName = e.users?.full_name?.toLowerCase() || '';
    const studentEmail = e.users?.email?.toLowerCase() || '';
    const courseTitle = e.courses?.title?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchSearch = !q || studentName.includes(q) || studentEmail.includes(q) || courseTitle.includes(q);
    const matchCourse = courseFilter === 'All' || e.course_id === courseFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;

    return matchSearch && matchCourse && matchStatus;
  });

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: { bg: '#ecfdf5', color: '#065f46', label: 'Active' },
      PENDING_PAYMENT: { bg: '#fff7ed', color: '#9a3412', label: 'Pending Payment' },
      COMPLETED: { bg: '#eff6ff', color: '#1e40af', label: 'Completed' },
      CANCELLED: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
    };
    const s = map[status] || { bg: '#f3f4f6', color: '#374151', label: status };
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
        {s.label}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getProgressBar = (progress) => {
    if (!progress) return <span className="font-body-sm text-muted">—</span>;
    const pct = progress.percent || 0;
    const completed = progress.completed || 0;
    const total = progress.total || 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', minWidth: 60
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct === 100 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #6366f1, #818cf8)',
            borderRadius: 4, transition: 'width 0.3s ease'
          }} />
        </div>
        <span className="font-body-sm" style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: 11, color: pct === 100 ? '#059669' : '#6366f1' }}>
          {completed}/{total} ({pct}%)
        </span>
      </div>
    );
  };

  return (
    <main className="admin-content container-max">
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`} style={{ marginBottom: 20 }}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="management-header">
        <div className="header-text">
          <h1 className="font-headline-lg">Danh sách Học viên</h1>
          <p className="font-body-md text-muted">Xem danh sách học viên đã đăng ký các khóa học của bạn và theo dõi tiến độ học tập.</p>
        </div>
        <div className="header-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm theo Tên, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm"
            />
          </div>
          <select className="status-select font-body-sm" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="All">Tất cả khóa học</option>
            {courses.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
          <select className="status-select font-body-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#6366f1' }}>group</span>
            <div>
              <p className="font-body-sm text-muted" style={{ margin: 0 }}>Tổng ghi danh</p>
              <p className="font-headline-sm" style={{ margin: 0 }}>{enrollments.length}</p>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#059669' }}>check_circle</span>
            <div>
              <p className="font-body-sm text-muted" style={{ margin: 0 }}>Đang học</p>
              <p className="font-headline-sm" style={{ margin: 0 }}>{enrollments.filter(e => e.status === 'ACTIVE').length}</p>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#f59e0b' }}>auto_stories</span>
            <div>
              <p className="font-body-sm text-muted" style={{ margin: 0 }}>Khóa học</p>
              <p className="font-headline-sm" style={{ margin: 0 }}>{courses.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải danh sách học viên...</span>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>group</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Chưa có học viên nào</h3>
          <p className="font-body-sm text-muted">Khi có học viên đăng ký khóa học của bạn, danh sách sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Email</th>
                  <th>Khóa học</th>
                  <th style={{ textAlign: 'center' }}>Ngày đăng ký</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((e) => (
                  <tr key={e.id} className="course-row">
                    <td>
                      <span className="font-body-sm font-bold">{e.users?.full_name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="font-body-sm text-muted">{e.users?.email || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="font-body-sm" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {e.courses?.title || 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="font-body-sm text-muted">{formatDate(e.enrolled_at)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getStatusBadge(e.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
