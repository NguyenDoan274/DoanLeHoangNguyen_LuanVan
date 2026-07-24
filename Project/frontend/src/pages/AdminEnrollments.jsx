import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminEnrollments() {
  const { user } = useOutletContext();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [instructorFilter, setInstructorFilter] = useState('All');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [actionLoading, setActionLoading] = useState(null);

  // Modal states
  const [orderModal, setOrderModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);

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
      const res = await fetch(`${API_BASE}/api/admin/enrollments`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setEnrollments(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi tải danh sách ghi danh.');
      }
    } catch {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Bạn có chắc muốn kích hoạt ghi danh này?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${id}/activate`, {
        method: 'PATCH',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', json.message || 'Đã kích hoạt ghi danh.');
        fetchEnrollments();
      } else {
        showAlert('error', json.message || 'Kích hoạt thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy ghi danh này?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${id}/cancel`, {
        method: 'PATCH',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', json.message || 'Đã hủy ghi danh.');
        fetchEnrollments();
      } else {
        showAlert('error', json.message || 'Hủy ghi danh thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewOrder = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${id}/order`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setOrderModal(json.data || null);
      } else {
        showAlert('error', json.message || 'Lỗi tải đơn hàng.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const handleViewPayment = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${id}/payment`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setPaymentModal(json.data || null);
      } else {
        showAlert('error', json.message || 'Lỗi tải thanh toán.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  // Extract unique courses and instructors for filter dropdowns
  const uniqueCourses = [...new Map(enrollments.map(e => [e.courses?.id, e.courses?.title]).filter(([id]) => id)).values()];
  const courseMap = Object.fromEntries(enrollments.map(e => [e.courses?.id, e.courses?.title]).filter(([id]) => id));

  const uniqueInstructors = [...new Map(enrollments.map(e => [e.courses?.users?.id, e.courses?.users?.full_name]).filter(([id]) => id)).values()];
  const instructorMap = Object.fromEntries(enrollments.map(e => [e.courses?.users?.id, e.courses?.users?.full_name]).filter(([id]) => id));

  // Filter logic
  const filteredEnrollments = enrollments.filter(e => {
    const studentName = e.users?.full_name?.toLowerCase() || '';
    const studentEmail = e.users?.email?.toLowerCase() || '';
    const courseTitle = e.courses?.title?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || studentName.includes(q) || studentEmail.includes(q) || courseTitle.includes(q);

    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchCourse = courseFilter === 'All' || e.course_id === courseFilter;
    const matchInstructor = instructorFilter === 'All' || e.courses?.instructor_id === instructorFilter;

    return matchSearch && matchStatus && matchCourse && matchInstructor;
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
          <h1 className="font-headline-lg">Quản lý Ghi danh</h1>
        </div>
        <div className="header-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm theo Tên, Email, Khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm"
            />
          </div>
          <select className="status-select font-body-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select className="status-select font-body-sm" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="All">Tất cả khóa học</option>
            {Object.entries(courseMap).map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
          <select className="status-select font-body-sm" value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)}>
            <option value="All">Tất cả giảng viên</option>
            {Object.entries(instructorMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải danh sách ghi danh...</span>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>school</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy ghi danh nào</h3>
          <p className="font-body-sm text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th style={{ textAlign: 'center' }}>Enrollment</th>
                  <th style={{ textAlign: 'center' }}>Order</th>
                  <th style={{ textAlign: 'center' }}>Payment</th>
                  <th style={{ textAlign: 'center' }}>Ngày ĐK</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((e) => (
                  <tr key={e.id} className="course-row">
                    <td>
                      <div>
                        <p className="font-body-sm font-bold" style={{ margin: 0 }}>{e.users?.full_name || 'N/A'}</p>
                        <p className="course-updated" style={{ margin: 0 }}>{e.users?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-body-sm" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {e.courses?.title || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="font-body-sm text-muted">{e.courses?.users?.full_name || 'N/A'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{getStatusBadge(e.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {e.order_items?.orders?.status ? getStatusBadge(e.order_items.orders.status) : <span className="font-body-sm text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {e.payment_status ? getStatusBadge(e.payment_status) : <span className="font-body-sm text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="font-body-sm text-muted">{formatDate(e.enrolled_at)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {e.status !== 'ACTIVE' && (
                          <button
                            disabled={actionLoading === e.id}
                            onClick={() => handleActivate(e.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            title="Kích hoạt ghi danh"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          </button>
                        )}
                        {e.status !== 'CANCELLED' && (
                          <button
                            disabled={actionLoading === e.id}
                            onClick={() => handleCancel(e.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'var(--error, #ba1a1a)', color: 'var(--error, #ba1a1a)' }}
                            title="Hủy ghi danh"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewOrder(e.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          title="Xem đơn hàng"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>receipt_long</span>
                        </button>
                        <button
                          onClick={() => handleViewPayment(e.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          title="Xem thanh toán"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>payments</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {orderModal !== undefined && orderModal !== null && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={() => setOrderModal(null)}>
          <div className="modal-content card" style={modalContentStyle} onClick={(ev) => ev.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="font-headline-sm">Chi tiết Đơn hàng</h2>
              <button onClick={() => setOrderModal(null)} className="icon-btn"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><strong>Mã đơn:</strong> {orderModal.id}</div>
              <div><strong>Học viên:</strong> {orderModal.users?.full_name} ({orderModal.users?.email})</div>
              <div><strong>Trạng thái:</strong> {getStatusBadge(orderModal.status)}</div>
              <div><strong>Tổng thanh toán:</strong> {parseFloat(orderModal.final_price || 0).toLocaleString('vi-VN')} đ</div>
              {orderModal.coupon_discount > 0 && (
                <div><strong>Giảm coupon:</strong> -{parseFloat(orderModal.coupon_discount).toLocaleString('vi-VN')} đ</div>
              )}
              {orderModal.promotion_discount > 0 && (
                <div><strong>Giảm KM:</strong> -{parseFloat(orderModal.promotion_discount).toLocaleString('vi-VN')} đ</div>
              )}
              <div><strong>Ngày tạo:</strong> {formatDate(orderModal.created_at)}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Các khóa học trong đơn:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  {orderModal.order_items?.map((item) => (
                    <li key={item.id} className="font-body-sm">
                      {item.courses?.title || 'N/A'} — {parseFloat(item.final_price || 0).toLocaleString('vi-VN')} đ
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Order Modal */}
      {orderModal === null && orderModal !== undefined && (
        <></>
      )}

      {/* Payment Detail Modal */}
      {paymentModal !== undefined && paymentModal !== null && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={() => setPaymentModal(null)}>
          <div className="modal-content card" style={modalContentStyle} onClick={(ev) => ev.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="font-headline-sm">Chi tiết Thanh toán</h2>
              <button onClick={() => setPaymentModal(null)} className="icon-btn"><span className="material-symbols-outlined">close</span></button>
            </div>
            {Array.isArray(paymentModal) && paymentModal.length > 0 ? (
              <div className="table-responsive">
                <table className="course-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Mã GD</th>
                      <th>Phương thức</th>
                      <th style={{ textAlign: 'right' }}>Số tiền</th>
                      <th style={{ textAlign: 'center' }}>Trạng thái</th>
                      <th>Ngày thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentModal.map((p) => (
                      <tr key={p.id}>
                        <td className="font-body-sm">{p.id?.substring(0, 8)}...</td>
                        <td className="font-body-sm">{p.payment_method || 'N/A'}</td>
                        <td className="font-body-sm" style={{ textAlign: 'right' }}>{parseFloat(p.amount || 0).toLocaleString('vi-VN')} đ</td>
                        <td style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</td>
                        <td className="font-body-sm">{formatDate(p.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-body-sm text-muted">Không có giao dịch thanh toán nào liên quan.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
  maxWidth: 640, width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: 24
};
