import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function PaymentCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      setVerifying(true);
      try {
        const res = await fetch(`${API_BASE}/api/payment/vnpay-callback${location.search}`);
        const json = await res.json();
        
        if (res.ok && json.success) {
          setSuccess(true);
          setMessage(json.message || 'Thanh toán thành công!');
          setDetails(json.data);
        } else {
          setSuccess(false);
          setMessage(json.message || 'Thanh toán không thành công hoặc chữ ký không hợp lệ.');
          if (json.data) {
            setDetails(json.data);
          }
        }
      } catch (err) {
        console.error('Callback error:', err);
        setSuccess(false);
        setMessage('Lỗi kết nối máy chủ khi xác thực thanh toán.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header />

      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}>
        <div style={{
          maxWidth: '550px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          padding: '40px 32px',
          textAlign: 'center'
        }} className="callback-card">
          {verifying ? (
            <div className="status-verifying">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '64px', color: '#2563eb' }}>sync</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1f2937', marginTop: '20px' }}>Đang xác thực giao dịch</h2>
              <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '8px' }}>
                Vui lòng không đóng trình duyệt hoặc quay lại trang trước. Chúng tôi đang xử lý giao dịch của bạn...
              </p>
            </div>
          ) : success ? (
            <div className="status-success animate-fade-in">
              <div className="checkmark-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#10b981', fontWeight: 'bold' }}>check</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#065f46', marginTop: '24px' }}>Thanh toán thành công!</h2>
              <p style={{ color: '#047857', fontSize: '16px', marginTop: '8px', fontWeight: 500 }}>
                {message}
              </p>
              
              <div style={{
                backgroundColor: '#ecfdf5',
                borderRadius: '8px',
                padding: '16px',
                margin: '24px 0',
                textAlign: 'left',
                border: '1px solid #d1fae5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: '#065f46' }}>Mã đơn hàng:</span>
                  <span style={{ color: '#047857', fontWeight: '600' }}>{details?.order_id?.substring(0, 8)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: '#065f46' }}>Phương thức:</span>
                  <span style={{ color: '#047857', fontWeight: '600' }}>VNPay Sandbox</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#065f46' }}>Trạng thái:</span>
                  <span style={{ color: '#10b981', fontWeight: '700' }}>ĐÃ THANH TOÁN</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                {details?.course_id ? (
                  <Link to={`/courses/${details.course_id}`} className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                    Vào khóa học này
                  </Link>
                ) : (
                  <Link to="/courses" className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                    Khám phá khóa học
                  </Link>
                )}
                <Link to="/my-courses" className="btn btn-secondary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                  Khóa học của bạn
                </Link>
              </div>
            </div>
          ) : (
            <div className="status-failure animate-fade-in">
              <div className="error-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444', fontWeight: 'bold' }}>close</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b', marginTop: '24px' }}>Thanh toán thất bại!</h2>
              <p style={{ color: '#b91c1c', fontSize: '16px', marginTop: '8px', fontWeight: 500 }}>
                {message}
              </p>

              <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '16px',
                margin: '24px 0',
                textAlign: 'left',
                border: '1px solid #fee2e2'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: '#991b1b' }}>Mã đơn hàng:</span>
                  <span style={{ color: '#b91c1c', fontWeight: '600' }}>{details?.order_id?.substring(0, 8)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#991b1b' }}>Trạng thái giao dịch:</span>
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>THẤT BẠI</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link to="/courses" className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                  Quay lại danh sách khóa học
                </Link>
                <Link to="/" className="btn btn-secondary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        .checkmark-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #d1fae5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 0 0 8px #ecfdf5;
          animation: pulse-green 2s infinite;
        }
        .error-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #fee2e2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 0 0 8px #fef2f2;
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes pulse-green {
          0% {
            box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0px rgba(16, 185, 129, 0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
