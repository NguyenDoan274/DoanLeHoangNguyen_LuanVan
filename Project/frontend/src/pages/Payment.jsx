import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
const DEFAULT_COURSE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/order/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setOrder(json.data);
        } else {
          setError(json.message || 'Không thể tìm thấy thông tin đơn hàng.');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Lỗi kết nối mạng, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  const handlePay = async () => {
    setError('');
    setProcessing(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/api/payment/create-vnpay-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: orderId })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Không thể tạo liên kết thanh toán VNPay.');
      }

      if (json.data && json.data.payment_url) {
        window.location.href = json.data.payment_url;
      } else {
        throw new Error('Liên kết thanh toán không hợp lệ.');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Đã xảy ra lỗi trong quá trình xử lý thanh toán.');
      setProcessing(false);
    }
  };

  const getCourseImage = (c) => {
    if (!c.thumbnail_url) return DEFAULT_COURSE_IMG;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
            <p>Đang tải thông tin đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--error)' }}>error</span>
            <h3>Đã xảy ra lỗi</h3>
            <p>{error || 'Không tìm thấy thông tin đơn hàng.'}</p>
            <Link to="/order-history" className="btn btn-primary" style={{ marginTop: 16 }}>Xem lịch sử đơn hàng</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header />

      <main style={{ flexGrow: 1, padding: '96px 24px 40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '24px', textAlign: 'center' }}>
            Thanh toán đơn hàng
          </h1>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Status Messages */}
            {order.status === 'COMPLETED' ? (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '16px',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#10b981' }}>check_circle</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Đơn hàng đã thanh toán thành công!</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Khóa học đã được đăng ký và sẵn sàng cho bạn học tập.</p>
                </div>
              </div>
            ) : order.status === 'CANCELLED' ? (
              <div style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>cancel</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Đơn hàng này đã bị hủy</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Bạn không thể thanh toán đơn hàng đã hủy. Vui lòng tạo đơn hàng mới.</p>
                </div>
              </div>
            ) : order.status === 'FAILED' ? (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '16px',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>error</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Đơn hàng này đã thất bại</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Giao dịch trước đó thất bại. Vui lòng tạo đơn hàng mới hoặc thử lại.</p>
                </div>
              </div>
            ) : null}

            {/* Order Meta Info */}
            <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                Mã đơn hàng: <strong style={{ color: '#111827' }}>{order.id.toUpperCase()}</strong>
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Ngày đặt: <strong style={{ color: '#111827' }}>{new Date(order.created_at).toLocaleDateString('vi-VN')}</strong>
              </p>
            </div>

            {/* Purchase Item List */}
            <div>
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Khóa học đăng ký:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {order.order_items?.map((item) => {
                  const course = item.courses;
                  if (!course) return null;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img
                        src={getCourseImage(course)}
                        alt={course.title}
                        style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                          {course.title}
                        </h4>
                        <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>
                          {parseFloat(item.final_price).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Summary */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '15px' }}>
                <span>Giá gốc:</span>
                <span>{parseFloat(order.base_price).toLocaleString('vi-VN')} đ</span>
              </div>
              {parseFloat(order.promotion_discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '15px' }}>
                  <span>Giảm giá khuyến mãi:</span>
                  <span>-{parseFloat(order.promotion_discount).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {parseFloat(order.coupon_discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '15px' }}>
                  <span>Giảm giá coupon:</span>
                  <span>-{parseFloat(order.coupon_discount).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 700,
                color: '#111827',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <span>Tổng số tiền:</span>
                <span style={{ color: '#ef4444', fontSize: '20px' }}>{parseFloat(order.final_price).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Actions / Pay button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              {order.status === 'PENDING' ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <button
                    onClick={handlePay}
                    disabled={processing}
                    style={{
                      width: '100%',
                      backgroundColor: processing ? '#93c5fd' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: processing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                    className="btn-pay-vnpay"
                  >
                    {processing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
                        Đang chuyển hướng đến VNPay...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">credit_card</span>
                        Thanh toán qua VNPay
                      </>
                    )}
                  </button>
                  <Link to="/order-history" style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                    Quay lại lịch sử đơn hàng
                  </Link>
                </div>
              ) : order.status === 'COMPLETED' ? (
                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                  <Link to="/my-courses" className="btn btn-primary" style={{ flex: 1, padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                    Vào học ngay
                  </Link>
                  <Link to="/order-history" className="btn btn-secondary" style={{ flex: 1, padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                    Xem lịch sử mua hàng
                  </Link>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <Link to="/courses" className="btn btn-primary" style={{ display: 'block', padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                    Quay lại danh sách khóa học
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <style>{`
        .btn-pay-vnpay:hover:not(:disabled) {
          background-color: #1d4ed8 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
