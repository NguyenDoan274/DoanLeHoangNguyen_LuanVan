import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCategories.css'; // Reuse table and modal styles

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminPromotions() {
  const { user } = useOutletContext();
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true,
    category_ids: [],
    course_ids: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch promotions
      const promoRes = await fetch(`${API_BASE}/api/admin/promotions`, { headers: authHeaders() });
      const promoJson = await promoRes.json();
      if (promoRes.ok) {
        setPromotions(Array.isArray(promoJson) ? promoJson : (promoJson.data || []));
      }

      // 2. Fetch categories
      const catRes = await fetch(`${API_BASE}/api/categories`);
      const catJson = await catRes.json();
      if (catRes.ok) {
        setCategories(catJson.data || []);
      }

      // 3. Fetch courses
      const courseRes = await fetch(`${API_BASE}/api/courses`);
      const courseJson = await courseRes.json();
      if (courseRes.ok) {
        setCourses(courseJson.data || []);
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discount_percentage: '',
      start_date: '',
      end_date: '',
      is_active: true,
      category_ids: [],
      course_ids: []
    });
    setEditingPromo(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().substring(0, 10);
  };

  const openEditModal = (p) => {
    setEditingPromo(p);
    setFormData({
      name: p.name || '',
      discount_percentage: p.discount_percentage ? Number(p.discount_percentage).toString() : '',
      start_date: formatDateForInput(p.start_date),
      end_date: formatDateForInput(p.end_date),
      is_active: p.is_active !== undefined ? p.is_active : true,
      category_ids: (p.promotion_categories || []).map(pc => pc.category_id),
      course_ids: (p.promotion_courses || []).map(pc => pc.course_id)
    });
    setShowCreateModal(true);
  };

  const handleSubmitPromo = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const bodyData = {
      name: formData.name,
      discount_percentage: Number(formData.discount_percentage),
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
      category_ids: formData.category_ids,
      course_ids: formData.course_ids
    };

    try {
      const url = editingPromo
        ? `${API_BASE}/api/admin/promotions/${editingPromo.id}`
        : `${API_BASE}/api/admin/promotions`;
      const method = editingPromo ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(bodyData)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingPromo ? 'Cập nhật khuyến mãi thành công!' : 'Tạo khuyến mãi thành công!');
        setShowCreateModal(false);
        resetForm();
        // Refresh data
        const refreshRes = await fetch(`${API_BASE}/api/admin/promotions`, { headers: authHeaders() });
        const refreshJson = await refreshRes.json();
        if (refreshRes.ok) {
          setPromotions(Array.isArray(refreshJson) ? refreshJson : (refreshJson.data || []));
        }
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/promotions/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa chương trình khuyến mãi thành công.');
        // Refresh data
        const refreshRes = await fetch(`${API_BASE}/api/admin/promotions`, { headers: authHeaders() });
        const refreshJson = await refreshRes.json();
        if (refreshRes.ok) {
          setPromotions(Array.isArray(refreshJson) ? refreshJson : (refreshJson.data || []));
        }
      } else {
        showAlert('error', json.message || 'Không thể xóa chương trình khuyến mãi.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const filteredPromotions = promotions.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="font-headline-lg">Quản lý khuyến mãi</h1>
          <p className="font-body-md text-muted">Quản lý các chương trình khuyến mãi cho các khóa học hoặc danh mục cụ thể.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter" style={{ marginRight: 16 }}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm chương trình khuyến mãi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm" 
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Tạo khuyến mãi
          </button>
        </div>
      </div>

      {/* Table / Loading State */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải chương trình khuyến mãi...</span>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>percent</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy chương trình khuyến mãi</h3>
          <p className="font-body-sm text-muted">Tạo một chương trình khuyến mãi mới để bắt đầu.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Tạo khuyến mãi
          </button>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Tên</th>
                  <th style={{ width: '10%' }}>Giảm giá (%)</th>
                  <th style={{ width: '20%' }}>Thời gian áp dụng</th>
                  <th style={{ width: '20%' }}>Áp dụng cho</th>
                  <th style={{ width: '10%' }}>Trạng thái</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.map((p) => {
                  const appliedCategories = (p.promotion_categories || []).map(pc => pc.categories?.name).filter(Boolean);
                  const appliedCourses = (p.promotion_courses || []).map(pc => pc.courses?.title).filter(Boolean);

                  return (
                    <tr key={p.id} className="course-row">
                      <td>
                        <strong style={{ fontSize: 14, color: 'var(--on-background)' }}>{p.name}</strong>
                      </td>
                      <td>
                        <span className="category-badge" style={{ fontSize: 13, padding: '4px 8px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                          {Number(p.discount_percentage)}%
                        </span>
                      </td>
                      <td>
                        <span className="font-body-sm text-muted">
                          {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {appliedCategories.length > 0 && (
                            <span style={{ fontSize: 11, color: '#312e81' }}>
                              📁 DM: {appliedCategories.join(', ')}
                            </span>
                          )}
                          {appliedCourses.length > 0 && (
                            <span style={{ fontSize: 11, color: '#1e3a8a' }}>
                              📚 KH: {appliedCourses.join(', ')}
                            </span>
                          )}
                          {appliedCategories.length === 0 && appliedCourses.length === 0 && (
                            <span style={{ fontSize: 11, color: '#6b7280' }}>Chưa áp dụng</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${p.is_active ? 'tag-published' : 'tag-draft'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: 10 }}>
                          <button className="action-icon-btn" title="Sửa" onClick={() => openEditModal(p)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="action-icon-btn text-error" title="Xóa" onClick={() => handleDeletePromo(p.id)}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingPromo ? 'Cập nhật khuyến mãi' : 'Thêm chương trình khuyến mãi'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitPromo} className="ic-modal-form">
              <div className="ic-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="ic-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="font-label-md">Tên chương trình *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ví dụ: Summer Sale 2026"
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Phần trăm giảm giá (%) *</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="ví dụ: 15"
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Trạng thái</label>
                  <select
                    className="input-field"
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Ngày bắt đầu *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Ngày kết thúc *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>

                {/* Target Categories (Checkbox select) */}
                <div className="ic-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="font-label-md">Áp dụng cho danh mục</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    padding: '12px',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--radius)'
                  }}>
                    {categories.map((cat) => (
                      <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.category_ids.includes(cat.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              category_ids: checked
                                ? [...prev.category_ids, cat.id]
                                : prev.category_ids.filter(id => id !== cat.id)
                            }));
                          }}
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Target Courses (Checkbox select) */}
                <div className="ic-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="font-label-md">Áp dụng cho khóa học </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '12px',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--radius)'
                  }}>
                    {courses.map((c) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.course_ids.includes(c.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              course_ids: checked
                                ? [...prev.course_ids, c.id]
                                : prev.course_ids.filter(id => id !== c.id)
                            }));
                          }}
                        />
                        <span>{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ic-modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Lưu...</>
                  ) : (
                    editingPromo ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'
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
