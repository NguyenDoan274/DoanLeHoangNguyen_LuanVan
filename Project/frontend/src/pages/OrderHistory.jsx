import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
const DEFAULT_COURSE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/order/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const json = await res.json();
      if (res.ok && json.data) {
        setOrders(json.data);
      } else {
        setError(json.message || 'Không thể tải danh sách đơn hàng.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Lỗi kết nối mạng, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?');
    if (!confirmCancel) return;

    const token = localStorage.getItem('access_token');
    setCancellingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/order/cancel-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok) {
        alert('Hủy đơn hàng thành công.');
        // Refresh orders list
        await fetchOrders();
      } else {
        alert(json.message || 'Không thể hủy đơn hàng.');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Lỗi kết nối mạng, vui lòng thử lại.');
    } finally {
      setCancellingId(null);
    }
  };

  const getCourseImage = (c) => {
    if (!c.thumbnail_url) return DEFAULT_COURSE_IMG;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            Đã thanh toán
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            Chờ thanh toán
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header />

      <main style={{ flexGrow: 1, padding: '96px 24px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827' }}>Lịch sử đơn hàng</h1>
            <p style={{ fontSize: '15px', color: '#4b5563', marginTop: '6px' }}>
              Xem danh sách đơn hàng đã mua hoặc đang chờ xử lý của bạn.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '16px',
              color: '#991b1b',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}>sync</span>
              <span style={{ fontSize: '15px', color: '#4b5563' }}>Đang tải danh sách đơn hàng...</span>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--primary)', opacity: 0.6 }}>receipt_long</span>
              <h3 style={{ marginTop: '24px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>Chưa có đơn hàng</h3>
              <p style={{ color: '#4b5563', fontSize: '15px', marginTop: '12px', marginBottom: '24px', lineHeight: '1.6', maxWidth: '400px' }}>
                Bạn chưa thực hiện bất kỳ giao dịch mua khóa học nào tại EduPro. Hãy tìm kiếm khóa học phù hợp để bắt đầu ngay!
              </p>
              <Link to="/courses" className="btn btn-primary" style={{ padding: '12px 32px', fontWeight: 600 }}>
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {orders.map((order) => {
                const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : 'Không rõ';

                return (
                  <div key={order.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                  }}>
                    {/* Order card header */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          Mã đơn: <strong style={{ color: '#374151' }}>{order.id.toUpperCase().substring(0, 8)}...</strong>
                        </span>
                        <span style={{ fontSize: '14px', color: '#4b5563' }}>
                          Ngày đặt: <strong>{orderDate}</strong>
                        </span>
                      </div>
                      <div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {order.order_items?.map((item) => {
                        const course = item.courses;
                        if (!course) return null;
                        return (
                          <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img
                              src={getCourseImage(course)}
                              alt={course.title}
                              style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                            />
                            <div style={{ flexGrow: 1 }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                {course.title}
                              </h4>
                              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                Đơn giá: {parseFloat(item.final_price).toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer / Total and Actions */}
                    <div style={{
                      padding: '16px 24px',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fafafa',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div>
                        <span style={{ fontSize: '14px', color: '#4b5563' }}>Tổng thanh toán: </span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>
                          {parseFloat(order.final_price).toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      {order.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'white',
                              color: '#ef4444',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '14px',
                              transition: 'all 0.2s ease'
                            }}
                            className="btn-cancel-action"
                          >
                            {cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                          </button>
                          <Link
                            to={`/payment/${order.id}`}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '14px',
                              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)'
                            }}
                          >
                            Thanh toán tiếp
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <style>{`
        .btn-cancel-action:hover:not(:disabled) {
          background-color: #fef2f2 !important;
          border-color: #ef4444 !important;
        }
      `}</style>
    </div>
  );
}
