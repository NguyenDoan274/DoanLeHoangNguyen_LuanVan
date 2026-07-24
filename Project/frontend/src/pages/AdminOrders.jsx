import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminOrders() {
  const { user } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Alert message
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [updatingId, setUpdatingId] = useState(null);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi tải danh sách đơn hàng.');
      }
    } catch (e) {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', `Đã cập nhật trạng thái đơn hàng sang: ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        showAlert('error', json.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const studentName = order.users?.full_name?.toLowerCase() || '';
    const studentEmail = order.users?.email?.toLowerCase() || '';
    const courseTitles = order.order_items?.map(item => item.courses?.title?.toLowerCase() || '').join(' ') || '';
    const orderId = order.id?.toLowerCase() || '';
    
    const matchesSearch = 
      studentName.includes(searchQuery.toLowerCase()) ||
      studentEmail.includes(searchQuery.toLowerCase()) ||
      courseTitles.includes(searchQuery.toLowerCase()) ||
      orderId.includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="font-headline-lg">Quản lý Đơn hàng</h1>
          <p className="font-body-md text-muted">Duyệt thông tin đơn hàng và chuyển trạng thái thanh toán thủ công cho học viên.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm theo Mã đơn, Tên, Email, Khóa học..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm" 
            />
          </div>
          <select 
            className="status-select font-body-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Pending">Chờ thanh toán (Pending)</option>
            <option value="Completed">Hoàn tất (Completed)</option>
            <option value="Failed">Thất bại (Failed)</option>
            <option value="Cancelled">Đã hủy (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* Orders Table Layout */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải danh sách đơn hàng...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>shopping_cart</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy đơn hàng nào</h3>
          <p className="font-body-sm text-muted">Thử tìm kiếm với từ khóa khác.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Mã Đơn / Học Viên</th>
                  <th style={{ width: '30%' }}>Các Khóa Học Đăng Ký</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Thanh Toán (đ)</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="course-row">
                    <td>
                      <div>
                        <p className="font-body-sm font-bold" style={{ margin: 0, color: 'var(--primary)' }}>
                          #{order.id.substring(0, 8)}...
                        </p>
                        <p className="font-body-md" style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                          {order.users?.full_name || 'N/A'}
                        </p>
                        <p className="course-updated" style={{ margin: 0 }}>
                          {order.users?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.order_items?.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span className="font-body-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                              - {item.courses?.title || 'Khóa học đã xóa'}
                            </span>
                            <span className="font-body-sm font-bold">
                              {parseFloat(item.final_price).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                        <span className="font-body-md font-bold" style={{ color: order.status === 'COMPLETED' ? 'var(--success, #0f5132)' : 'inherit' }}>
                          {parseFloat(order.final_price).toLocaleString('vi-VN')} đ
                        </span>
                        {parseFloat(order.coupon_discount || 0) > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--error, #ba1a1a)' }}>
                            Coupon: -{parseFloat(order.coupon_discount).toLocaleString('vi-VN')} đ
                          </span>
                        )}
                        {parseFloat(order.promotion_discount || 0) > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--error, #ba1a1a)' }}>
                            KM: -{parseFloat(order.promotion_discount).toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge font-bold`} style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: 
                          order.status === 'COMPLETED' ? '#ecfdf5' : 
                          order.status === 'PENDING' ? '#fff7ed' : '#fef2f2',
                        color: 
                          order.status === 'COMPLETED' ? '#065f46' : 
                          order.status === 'PENDING' ? '#9a3412' : '#991b1b'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {order.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Xác nhận đã thanh toán xong đơn hàng này"
                          >
                            Duyệt
                          </button>
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--error, #ba1a1a)', color: 'var(--error, #ba1a1a)' }}
                            title="Hủy đơn hàng"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <span className="font-body-sm text-muted">Không khả dụng</span>
                      )}
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
