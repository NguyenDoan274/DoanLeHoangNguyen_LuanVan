import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCategories.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminCategories() {
  const { user } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setCategories(Array.isArray(json) ? json : (json.data || []));
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingCategory
        ? `${API_BASE}/api/admin/categories/${editingCategory.id}`
        : `${API_BASE}/api/admin/categories`;
      const method = editingCategory ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingCategory ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchCategories();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa danh mục thành công.');
        fetchCategories();
      } else {
        showAlert('error', json.message || 'Không thể xóa danh mục này.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="font-headline-lg">Quản lý danh mục</h1>
          <p className="font-body-md text-muted">Thêm, sửa hoặc xóa danh mục để nhóm các khóa học.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter" style={{ marginRight: 16 }}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm danh mục..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm" 
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Tạo danh mục
          </button>
        </div>
      </div>

      {/* Table / Loading State */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải danh mục...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>category</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy danh mục</h3>
          <p className="font-body-sm text-muted">Thêm danh mục mới để bắt đầu.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Tạo danh mục
          </button>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Tên danh mục</th>
                  <th style={{ width: '50%' }}>Mô tả</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="course-row">
                    <td>
                      <span className="category-badge" style={{ fontSize: 13, padding: '6px 12px' }}>{cat.name}</span>
                    </td>
                    <td>
                      <p className="font-body-sm text-muted" style={{ margin: 0 }}>
                        {cat.description || 'Không có mô tả'}
                      </p>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: 10 }}>
                        <button className="action-icon-btn" title="Cập nhật" onClick={() => openEditModal(cat)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="action-icon-btn text-error" title="Xóa" onClick={() => handleDeleteCategory(cat.id)}>
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

      {/* Category Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingCategory ? 'Sửa danh mục' : 'Tạo danh mục'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitCategory} className="ic-modal-form">
              <div className="ic-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="ic-form-group">
                  <label className="font-label-md">Tên danh mục *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên danh mục..."
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Mô tả</label>
                  <textarea
                    className="input-field ic-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Nhập mô tả danh mục..."
                    style={{ minHeight: 120 }}
                  />
                </div>
              </div>

              <div className="ic-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...</>
                  ) : (
                    editingCategory ? 'Cập nhật danh mục' : 'Tạo danh mục'
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
