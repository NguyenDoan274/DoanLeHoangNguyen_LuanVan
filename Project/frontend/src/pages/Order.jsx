import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function Order() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [group, setGroup] = useState(null);
  const [itemsToPurchase, setItemsToPurchase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const isGroup = queryParams.get('type') === 'group';

  const defaultCourseImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'STUDENT') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // First get enrolled course IDs to filter
        let enrolledIds = [];
        const enrollRes = await fetch(`${API_BASE}/api/student/my-courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (enrollRes.ok) {
          const enrollJson = await enrollRes.json();
          if (enrollJson.data) {
            enrolledIds = enrollJson.data.map(c => c.id);
          }
        }

        if (isGroup) {
          // Fetch group details
          const res = await fetch(`${API_BASE}/api/course-group/${courseId}`);
          const json = await res.json();
          if (res.ok && json.data) {
            setGroup(json.data);
            const remaining = (json.data.course_group_items || [])
              .map(item => item.courses)
              .filter(c => c && !enrolledIds.includes(c.id));
            
            setItemsToPurchase(remaining);
            if (remaining.length === 0) {
              setError('Bạn đã đăng ký toàn bộ các khóa học trong lộ trình này rồi.');
            }
          } else {
            setError('Không thể tìm thấy thông tin lộ trình học.');
          }
        } else {
          // Fetch course details
          const res = await fetch(`${API_BASE}/api/course/${courseId}`);
          const json = await res.json();
          if (res.ok && json.data) {
            setCourse(json.data);
            setItemsToPurchase([json.data]);
            
            // Check if final price (with promotions) is 0
            const promo = json.data.discount_percentage && json.data.discount_percentage > 0;
            const finalPrice = promo ? parseFloat(json.data.discounted_price || 0) : parseFloat(json.data.price || 0);

            if (finalPrice === 0) {
              navigate(`/courses/${courseId}`);
            }
          } else {
            setError('Không thể tìm thấy thông tin khóa học.');
          }
        }
      } catch (err) {
        console.error('Error fetching checkout info:', err);
        setError('Lỗi kết nối mạng, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, isGroup, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      setCouponSuccess('');
      return;
    }
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/api/order/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAppliedCoupon(data.data);
        setCouponSuccess(`Áp dụng mã giảm giá thành công! Giảm ${data.data.discount_percentage}%.`);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Lỗi kết nối mạng, vui lòng thử lại.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setError('');
    setProcessing(true);
    const token = localStorage.getItem('access_token');

    try {
      // 1. Create order (group or single)
      const orderUrl = isGroup
        ? `${API_BASE}/api/order/create-group-order`
        : `${API_BASE}/api/order/create-order`;

      const orderBody = isGroup
        ? { course_group_id: courseId, coupon_code: appliedCoupon ? appliedCoupon.code : undefined }
        : { course_id: courseId, coupon_code: appliedCoupon ? appliedCoupon.code : undefined };

      const orderRes = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderBody)
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Không thể khởi tạo đơn hàng.');
      }

      // Navigate to dedicated payment page
      navigate(`/payment/${orderData.data.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Đã xảy ra lỗi trong quá trình xử lý đơn hàng.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="loading-container" style={{ textAlign: 'center' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
            <p style={{ marginTop: 8 }}>Đang tải thông tin đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && itemsToPurchase.length === 0) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="error-container" style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--error)' }}>error</span>
            <h3>Đã xảy ra lỗi</h3>
            <p>{error}</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Quay lại danh sách khóa học</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayTitle = isGroup ? (group?.title || '') : (course?.title || '');
  const breadcrumbLink = isGroup ? `/roadmaps/${group?.id}` : `/courses/${course?.id}`;

  // Price calculations
  const totalBasePrice = itemsToPurchase.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalPromoDiscount = itemsToPurchase.reduce((sum, item) => {
    if (item.discount_percentage && item.discount_percentage > 0) {
      const original = parseFloat(item.price || 0);
      const discounted = parseFloat(item.discounted_price || 0);
      return sum + (original - discounted);
    }
    return sum;
  }, 0);
  const priceAfterPromo = totalBasePrice - totalPromoDiscount;
  const couponDiscount = appliedCoupon
    ? priceAfterPromo * (appliedCoupon.discount_percentage / 100)
    : 0;
  const finalPrice = priceAfterPromo - couponDiscount;

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header />

      <main style={{ flexGrow: 1, padding: '40px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: '#6b7280' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <Link to={breadcrumbLink} style={{ color: 'inherit', textDecoration: 'none' }}>{displayTitle}</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <span style={{ color: '#111827', fontWeight: 500 }}>Thanh toán</span>
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Thông tin thanh toán</h1>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '16px',
              color: '#991b1b',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }} className="order-layout-grid">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Items to Purchase List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontWeight: 600, color: '#4b5563', margin: '0 0 8px 0' }}>
                  {isGroup ? `Danh sách khóa học trong lộ trình (${itemsToPurchase.length})` : 'Thông tin khóa học'}
                </p>
                {itemsToPurchase.map((item) => {
                  const itemImage = item.thumbnail_url
                    ? (item.thumbnail_url.startsWith('http') ? item.thumbnail_url : `${API_BASE}${item.thumbnail_url}`)
                    : defaultCourseImage;
                  return (
                    <div key={item.id} style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      gap: '20px'
                    }}>
                      <img
                        src={itemImage}
                        alt={item.title}
                        style={{ width: '180px', height: '110px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                        <div>
                          <span style={{
                            backgroundColor: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {item.categories?.name || 'Khóa học'}
                          </span>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '8px', marginBottom: '4px' }}>
                            {item.title}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
                            Giảng viên: <span style={{ fontWeight: 500 }}>{item.users?.full_name || 'Expert Instructor'}</span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                          <span>Trình độ: {item.level === 'BEGINNER' ? 'Mới bắt đầu' : item.level === 'INTERMEDIATE' ? 'Trung cấp' : 'Nâng cao'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.discount_percentage && item.discount_percentage > 0 ? (
                              <>
                                <span style={{ textDecoration: 'line-through', fontSize: '13px', color: '#9ca3af' }}>
                                  {parseFloat(item.price).toLocaleString('vi-VN')} đ
                                </span>
                                <span style={{ fontWeight: 700, color: '#ef4444' }}>
                                  {parseFloat(item.discounted_price).toLocaleString('vi-VN')} đ
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', backgroundColor: '#ef4444', padding: '2px 4px', borderRadius: '3px' }}>
                                  -{item.discount_percentage}%
                                </span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {parseFloat(item.price) > 0 ? `${parseFloat(item.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods Info */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Phương thức thanh toán</h3>
                <div style={{
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#eff6ff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '28px' }}>account_balance</span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e3a8a', display: 'block' }}>Cổng thanh toán VNPay</span>
                      <span style={{ fontSize: '12px', color: '#1e40af' }}>Thanh toán qua thẻ ATM, thẻ quốc tế hoặc quét mã QR</span>
                    </div>
                  </div>
                  <img
                    src="https://img.vietqr.io/image/vnpay.png"
                    alt="VNPay"
                    style={{ height: '32px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column (Summary & Button) */}
            <div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                position: 'sticky',
                top: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                    Tóm tắt đơn hàng
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#4b5563' }}>
                    <span>Giá gốc:</span>
                    <span>{totalBasePrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {totalPromoDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#ef4444' }}>
                      <span>Khuyến mãi khóa học:</span>
                      <span>-{totalPromoDiscount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#ef4444' }}>
                      <span>Giảm giá coupon ({appliedCoupon.discount_percentage}%):</span>
                      <span>-{couponDiscount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#111827', borderTop: '1px dashed #e5e7eb', paddingTop: '16px', marginTop: '4px' }}>
                    <span>Tổng số tiền:</span>
                    <span style={{ color: '#ef4444', fontSize: '20px' }}>{finalPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {/* Coupon input form */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>Mã giảm giá (Coupon)</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nhập mã..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={appliedCoupon !== null}
                      style={{
                        flexGrow: 1,
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                          setCouponSuccess('');
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        Hủy
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4b5563',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        {validatingCoupon ? '...' : 'Áp dụng'}
                      </button>
                    )}
                  </div>
                  {couponError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{couponError}</p>}
                  {couponSuccess && <p style={{ color: '#10b981', fontSize: '12px', margin: '4px 0 0 0' }}>{couponSuccess}</p>}
                </div>

                <button
                  onClick={handleCheckout}
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
                  className="btn-checkout-vnpay"
                >
                  {processing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
                      Đang tạo đơn hàng...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">shopping_cart_checkout</span>
                      Xác nhận đặt hàng
                    </>
                  )}
                </button>

                <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '0', lineHeight: 1.5 }}>
                  Bằng cách hoàn tất giao dịch, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của EduPro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Dynamic CSS styles locally */}
      <style>{`
        .btn-checkout-vnpay:hover:not(:disabled) {
          background-color: #1d4ed8 !important;
          transform: translateY(-1px);
        }
        .btn-checkout-vnpay:active:not(:disabled) {
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .order-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
