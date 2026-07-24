import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCategories.css'; // Reuse table and modal styles

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminCoupons() {
  const { user } = useOutletContext();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setCoupons(Array.isArray(json) ? json : (json.data || []));
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: '',
      start_date: '',
      end_date: '',
      usage_limit: '',
      status: 'ACTIVE'
    });
    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().substring(0, 10);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code || '',
      discount_percentage: c.discount_percentage ? Number(c.discount_percentage).toString() : '',
      start_date: formatDateForInput(c.start_date),
      end_date: formatDateForInput(c.end_date),
      usage_limit: c.usage_limit ? c.usage_limit.toString() : '',
      status: c.status || 'ACTIVE'
    });
    setShowCreateModal(true);
  };

  const handleSubmitCoupon = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const bodyData = {
      code: formData.code,
      discount_percentage: Number(formData.discount_percentage),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      status: formData.status
    };

    try {
      const url = editingCoupon
        ? `${API_BASE}/api/admin/coupons/${editingCoupon.id}`
        : `${API_BASE}/api/admin/coupons`;
      const method = editingCoupon ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(bodyData)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingCoupon ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchCoupons();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa mã giảm giá thành công.');
        fetchCoupons();
      } else {
        showAlert('error', json.message || 'Không thể xóa mã giảm giá này.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="font-headline-lg">Quản lý mã giảm giá</h1>
          <p className="font-body-md text-muted">Tạo, chỉnh sửa hoặc xóa mã giảm giá cho người học.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter" style={{ marginRight: 16 }}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm mã giảm giá..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm" 
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Tạo mã giảm giá
          </button>
        </div>
      </div>

      {/* Table / Loading State */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải mã giảm giá...</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>confirmation_number</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy mã giảm giá nào</h3>
          <p className="font-body-sm text-muted">Tạo mã giảm giá mới để bắt đầu.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Tạo mã giảm giá
          </button>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Mã giảm giá</th>
                  <th style={{ width: '15%' }}>% Giảm giá</th>
                  <th style={{ width: '20%' }}>Thời gian sử dụng</th>
                  <th style={{ width: '15%' }}>Giới hạn sử dụng</th>
                  <th style={{ width: '15%' }}>Trạng thái</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="course-row">
                    <td>
                      <strong style={{ fontSize: 15, color: 'var(--primary)' }}>{c.code}</strong>
                    </td>
                    <td>
                      <span className="category-badge" style={{ fontSize: 13, padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {Number(c.discount_percentage)}%
                      </span>
                    </td>
                    <td>
                      <span className="font-body-sm text-muted">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A'} - {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="font-body-sm">
                        {c.used_count} / {c.usage_limit || '∞'}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${c.status === 'ACTIVE' ? 'tag-published' : 'tag-draft'}`} style={{ textTransform: 'capitalize' }}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: 10 }}>
                        <button className="action-icon-btn" title="Sửa" onClick={() => openEditModal(c)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="action-icon-btn text-error" title="Xóa" onClick={() => handleDeleteCoupon(c.id)}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
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

      {/* Coupon Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitCoupon} className="ic-modal-form">
              <div className="ic-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="ic-form-group">
                  <label className="font-label-md">Coupon Code *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ví dụ: EDU20"
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Phần trăm giảm giá (%)*</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="Ví dụ: 20"
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Ngày bắt đầu</label>
                  <input
                    className="input-field"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Ngày kết thúc</label>
                  <input
                    className="input-field"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Số lần sử dụng*</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Trạng thái</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="EXPIRED">Hết hạn</option>
                  </select>
                </div>
              </div>

              <div className="ic-modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...</>
                  ) : (
                    editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
