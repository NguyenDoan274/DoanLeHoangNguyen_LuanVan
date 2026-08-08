import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminPayments() {
  const { user } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Alert message
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
    fetchPaymentsAndStats();
  }, []);

  const fetchPaymentsAndStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch payments
      const payRes = await fetch(`${API_BASE}/api/admin/payments`, {
        headers: authHeaders()
      });
      const payJson = await payRes.json();
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/api/admin/payments/stats`, {
        headers: authHeaders()
      });
      const statsJson = await statsRes.json();

      if (payRes.ok && statsRes.ok) {
        setPayments(payJson.data || []);
        setStats(statsJson.data || null);
      } else {
        showAlert('error', payJson.message || statsJson.message || 'Lỗi tải dữ liệu thanh toán.');
      }
    } catch (e) {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(pay => {
    const studentName = pay.orders?.users?.full_name?.toLowerCase() || '';
    const studentEmail = pay.orders?.users?.email?.toLowerCase() || '';
    const txRef = pay.transaction_reference?.toLowerCase() || '';
    const payId = pay.id?.toLowerCase() || '';
    
    const matchesSearch = 
      studentName.includes(searchQuery.toLowerCase()) ||
      studentEmail.includes(searchQuery.toLowerCase()) ||
      txRef.includes(searchQuery.toLowerCase()) ||
      payId.includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || pay.status === statusFilter.toUpperCase();
    
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
          <h1 className="font-headline-lg">Thanh Toán</h1>
          <p className="font-body-md text-muted">Xem số liệu thống kê doanh thu bán hàng và nhật ký lịch sử thanh toán của hệ thống.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm theo Mã GD, Mã TT, Tên, Email..." 
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
            <option value="Success">Thành công (Success)</option>
            <option value="Pending">Chờ xử lý (Pending)</option>
            <option value="Failed">Thất bại (Failed)</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && !loading && (
        <section className="stats-overview" style={{ marginBottom: '32px' }}>
          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng doanh thu thực tế</p>
              <h3 className="stat-value" style={{ color: 'var(--success, #0f5132)' }}>
                {parseFloat(stats.totalRevenue).toLocaleString('vi-VN')} đ
              </h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Giao dịch thành công</p>
              <h3 className="stat-value">{stats.totalSuccess}</h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#d97706' }}>
              <span className="material-symbols-outlined">sync</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Giao dịch đang chờ</p>
              <h3 className="stat-value">{stats.totalPending}</h3>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <span className="material-symbols-outlined">cancel</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Giao dịch thất bại</p>
              <h3 className="stat-value">{stats.totalFailed}</h3>
            </div>
          </div>
        </section>
      )}

      {/* Method Revenue Breakdown */}
      {stats && stats.methodStats && stats.methodStats.length > 0 && !loading && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h2 className="font-headline-sm" style={{ marginTop: 0, marginBottom: '16px' }}>Doanh thu theo phương thức</h2>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {stats.methodStats.map((ms, index) => (
              <div key={index} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--outline-variant, #e5e7eb)', minWidth: '180px', flexGrow: 1 }}>
                <span className="font-body-sm text-muted" style={{ display: 'block', fontWeight: 600 }}>{ms.method}</span>
                <span className="font-headline-sm" style={{ fontWeight: 800, marginTop: '4px', display: 'block' }}>
                  {ms.revenue.toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Table Layout */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải nhật ký thanh toán...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>payments</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không có thanh toán nào</h3>
          <p className="font-body-sm text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Mã Giao Dịch</th>
                  <th style={{ width: '20%' }}>Học Viên</th>
                  <th style={{ width: '15%' }}>Phương Thức</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Số Tiền</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '12%' }}>Ngày GD</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="course-row">
                    <td>
                      <div>
                        <p className="font-body-sm font-bold" style={{ margin: 0, color: 'var(--primary)' }}>
                          #{pay.id.substring(0, 8)}...
                        </p>
                        {pay.transaction_reference && (
                          <p className="course-updated" style={{ margin: '2px 0 0 0' }}>
                            Mã GD VNPAY: <strong>{pay.transaction_reference}</strong>
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-body-md" style={{ margin: 0, fontWeight: 600 }}>
                          {pay.orders?.users?.full_name || 'N/A'}
                        </p>
                        <p className="course-updated" style={{ margin: 0 }}>
                          {pay.orders?.users?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{pay.payment_method}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-body-md font-bold" style={{ color: pay.status === 'SUCCESS' ? 'var(--success, #0f5132)' : 'inherit' }}>
                        {parseFloat(pay.amount).toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge font-bold`} style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: 
                          pay.status === 'SUCCESS' ? '#ecfdf5' : 
                          pay.status === 'PENDING' ? '#fff7ed' : '#fef2f2',
                        color: 
                          pay.status === 'SUCCESS' ? '#065f46' : 
                          pay.status === 'PENDING' ? '#9a3412' : '#991b1b'
                      }}>
                        {pay.status}
                      </span>
                    </td>
                    <td>
                      <span className="font-body-sm text-muted">
                        {pay.paid_at ? new Date(pay.paid_at).toLocaleString('vi-VN') : (pay.created_at ? new Date(pay.created_at).toLocaleString('vi-VN') : 'N/A')}
                      </span>
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
