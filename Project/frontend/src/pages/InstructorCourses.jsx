import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import '../css/InstructorCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorCourses() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '', short_description: '', description: '', category_id: '', level: 'BEGINNER', price: 0, status: 'DRAFT'
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) setCourses(Array.isArray(json) ? json : (json.data || []));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/categories`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) setCategories(Array.isArray(json) ? json : (json.data || []));
    } catch { /* ignore */ }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const resetForm = () => {
    setFormData({ title: '', short_description: '', description: '', category_id: '', level: 'BEGINNER', price: 0, status: 'DRAFT' });
    setThumbnailFile(null);
    setEditingCourse(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      short_description: course.short_description || '',
      description: course.description || '',
      category_id: course.category_id || '',
      level: course.level || 'BEGINNER',
      price: course.price || 0,
      status: course.status || 'DRAFT'
    });
    setThumbnailFile(null);
    setShowCreateModal(true);
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('short_description', formData.short_description);
    fd.append('description', formData.description);
    fd.append('category_id', formData.category_id);
    fd.append('level', formData.level);
    fd.append('price', formData.price.toString());
    fd.append('status', formData.status);
    if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

    try {
      const url = editingCourse
        ? `${API_BASE}/api/instructor/courses/${editingCourse.id}`
        : `${API_BASE}/api/instructor/courses`;
      const method = editingCourse ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: fd });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingCourse ? 'Cập nhật khóa học thành công!' : 'Tạo khóa học thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchCourses();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối server.');
    } finally { setSubmitting(false); }
  };

  const handleHideCourse = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${id}/hide`, {
        method: 'PATCH', headers: authHeaders()
      });
      if (res.ok) { showAlert('success', 'Đã ẩn khóa học.'); fetchCourses(); }
    } catch { showAlert('error', 'Lỗi kết nối.'); }
  };

  const handleUpdateStatus = async (course, newStatus) => {
    const fd = new FormData();
    fd.append('title', course.title);
    fd.append('category_id', course.category_id || course.categories?.id || '');
    fd.append('status', newStatus);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${course.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: fd
      });
      if (res.ok) {
        showAlert('success', `Đã cập nhật trạng thái khóa học thành ${newStatus}.`);
        fetchCourses();
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khóa học này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${id}`, {
        method: 'DELETE', headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) { showAlert('success', 'Đã xóa khóa học.'); fetchCourses(); }
      else { showAlert('error', data.message || 'Xóa khóa học thất bại.'); }
    } catch { showAlert('error', 'Lỗi kết nối.'); }
  };

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getThumbnailUrl = (course) => {
    if (!course.thumbnail_url) return null;
    return course.thumbnail_url.startsWith('http') ? course.thumbnail_url : `${API_BASE}${course.thumbnail_url}`;
  };



  return (
    <div className="courses-content container-max">
      {/* Alerts */}
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Management Header */}
      <div className="mgmt-header">
        <div className="mgmt-text">
          <h1 className="font-headline-lg">Khóa học của tôi</h1>
          <p className="font-body-md text-muted">Quản lý và theo dõi hiệu quả hoạt động của các khóa học.</p>
        </div>
        <div className="mgmt-filters">
          <div className="mgmt-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm"
            />
          </div>
          <select
            className="mgmt-status-select font-body-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="HIDDEN">Ẩn</option>
          </select>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Tạo khóa học mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="courses-stats">
        <div className="cs-stat card">
          <div className="cs-stat-icon bg-blue"><span className="material-symbols-outlined">library_books</span></div>
          <div><p className="cs-stat-label">Tổng số khóa học</p><h3 className="cs-stat-value">{courses.length}</h3></div>
        </div>
        <div className="cs-stat card">
          <div className="cs-stat-icon bg-green"><span className="material-symbols-outlined">public</span></div>
          <div><p className="cs-stat-label">Đã xuất bản</p><h3 className="cs-stat-value">{courses.filter(c => c.status === 'PUBLISHED').length}</h3></div>
        </div>
        <div className="cs-stat card">
          <div className="cs-stat-icon bg-yellow"><span className="material-symbols-outlined">edit_note</span></div>
          <div><p className="cs-stat-label">Bản nháp</p><h3 className="cs-stat-value">{courses.filter(c => c.status === 'DRAFT').length}</h3></div>
        </div>
        <div className="cs-stat card">
          <div className="cs-stat-icon bg-gray"><span className="material-symbols-outlined">visibility_off</span></div>
          <div><p className="cs-stat-label">Ẩn</p><h3 className="cs-stat-value">{courses.filter(c => c.status === 'HIDDEN').length}</h3></div>
        </div>
      </div>

      {/* Course Table */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>school</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy khóa học</h3>
          <p className="font-body-sm text-muted">Tạo khóa học đầu tiên của bạn để bắt đầu!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Tạo khóa học mới
          </button>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="ic-course-table">
              <thead>
                <tr>
                  <th>Thông tin</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Cấp độ</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="ic-course-row">
                    <td>
                      <div className="ic-course-detail">
                        {getThumbnailUrl(course) ? (
                          <img
                            src={getThumbnailUrl(course)}
                            alt={course.title}
                            className="ic-course-thumb"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/instructor/courses/${course.id}`)}
                          />
                        ) : (
                          <div
                            className="ic-course-thumb-placeholder"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/instructor/courses/${course.id}`)}
                          >
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                        <div>
                          <p
                            className="ic-course-title"
                            style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}
                            onClick={() => navigate(`/instructor/courses/${course.id}`)}
                          >
                            {course.title}
                          </p>
                          <p className="ic-course-desc">{course.short_description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ic-category-badge">{course.categories?.name || '—'}</span>
                    </td>
                    <td>
                      <p className="ic-course-price">{new Intl.NumberFormat('vi-VN').format(course.price || 0)}</p>
                    </td>
                    <td>
                      <span className={`ic-level-badge level-${(course.level || 'beginner').toLowerCase()}`}>
                        {course.level === 'ADVANCED' ? 'Nâng cao' : course.level === 'INTERMEDIATE' ? 'Trung cấp' : 'Mới bắt đầu' || 'Mới bắt đầu'}
                      </span>
                    </td>
                    <td>
                      <div className="ic-status-cell">
                        <div className={`ic-status-dot status-${(course.status || 'draft').toLowerCase()}`}></div>
                        <span className={`ic-status-text text-${(course.status || 'draft').toLowerCase()}`}>
                          {course.status || 'DRAFT'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="ic-actions">
                        <button className="ic-action-btn" title="Quản lý chương học" onClick={() => navigate(`/instructor/courses/${course.id}`)}>
                          <span className="material-symbols-outlined">menu_book</span>
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

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingCourse ? 'Cập nhật khóa học' : 'Thêm khóa học'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitCourse} className="ic-modal-form">
              <div className="ic-form-grid">
                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Tên Khóa Học *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tên khóa học..."
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Danh mục *</label>
                  <select
                    className="input-field"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Cấp độ</label>
                  <select
                    className="input-field"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="BEGINNER">Mới bắt đầu</option>
                    <option value="INTERMEDIATE">Trung cấp</option>
                    <option value="ADVANCED">Nâng cao</option>
                  </select>
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Giá (VNĐ)</label>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Trạng Thái</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Nháp</option>
                    <option value="PUBLISHED">Xuất bản</option>
                    <option value="HIDDEN">Ẩn</option>
                  </select>
                </div>

                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Mô tả ngắn</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Mô tả ngắn..."
                  />
                </div>

                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Mô tả chi tiết</label>
                  <textarea
                    className="input-field ic-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết khóa học..."
                  />
                </div>

                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Ảnh Thumbnail</label>
                  <div className="ic-file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      id="course-thumbnail"
                      className="ic-file-input"
                      onChange={(e) => setThumbnailFile(e.target.files[0] || null)}
                    />
                    <label htmlFor="course-thumbnail" className="ic-file-label">
                      <span className="material-symbols-outlined">cloud_upload</span>
                      <span>{thumbnailFile ? thumbnailFile.name : 'Chọn ảnh thumbnail...'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="ic-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Lưu...</>
                  ) : (
                    editingCourse ? 'Cập nhật khóa học' : 'Tạo khóa học'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
