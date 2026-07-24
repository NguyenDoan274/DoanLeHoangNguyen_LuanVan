import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/InstructorCourseGroups.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorCourseGroups() {
  const { user } = useOutletContext();
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit Group State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    order_index: 0
  });

  // Manage Group Courses State
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupCourses, setGroupCourses] = useState([]);
  const [newCourseIdToAdd, setNewCourseIdToAdd] = useState('');
  const [isRequiredForGroup, setIsRequiredForGroup] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchGroups();
    fetchCategories();
    fetchCourses();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setGroups(Array.isArray(json) ? json : (json.data || []));
      }
    } catch (e) {
      console.error("Error fetching groups:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/categories`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setCategories(Array.isArray(json) ? json : (json.data || []));
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setCourses(Array.isArray(json) ? json : (json.data || []));
      }
    } catch (e) {
      console.error("Error fetching courses:", e);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      order_index: 0
    });
    setEditingGroup(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
    setShowCreateModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      title: group.title || '',
      description: group.description || '',
      category_id: group.category_id || '',
      order_index: group.order_index || 0
    });
    setShowCreateModal(true);
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingGroup
        ? `${API_BASE}/api/instructor/course-groups/${editingGroup.id}`
        : `${API_BASE}/api/instructor/course-groups`;
      const method = editingGroup ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingGroup ? 'Cập nhật nhóm thành công!' : 'Tạo nhóm thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchGroups();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Đã xóa nhóm khóa học.');
        fetchGroups();
      } else {
        showAlert('error', json.message || 'Không thể xóa nhóm này.');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  // --- Course Association Management ---
  const openManageCoursesModal = async (group) => {
    setSelectedGroup(group);
    setNewCourseIdToAdd('');
    setIsRequiredForGroup(false);
    await fetchCoursesInGroup(group.id);
  };

  const fetchCoursesInGroup = async (groupId) => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups/${groupId}/courses`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setGroupCourses(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching courses in group:", err);
    }
  };

  const handleAddCourseToGroup = async (e) => {
    e.preventDefault();
    if (!newCourseIdToAdd) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups/${selectedGroup.id}/courses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          course_id: newCourseIdToAdd,
          is_required: isRequiredForGroup
        })
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Đã thêm khóa học vào nhóm.');
        setNewCourseIdToAdd('');
        setIsRequiredForGroup(false);
        fetchCoursesInGroup(selectedGroup.id);
        fetchGroups(); // refresh course count on dashboard
      } else {
        showAlert('error', json.message || 'Không thể thêm khóa học.');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const handleRemoveCourseFromGroup = async (courseId) => {
    if (!window.confirm('Xóa khóa học này khỏi nhóm?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups/${selectedGroup.id}/courses/${courseId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Đã xóa khóa học khỏi nhóm.');
        fetchCoursesInGroup(selectedGroup.id);
        fetchGroups(); // refresh course count on dashboard
      } else {
        showAlert('error', json.message || 'Không thể xóa khóa học.');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const handleReorderCourse = async (index, direction) => {
    const newItems = [...groupCourses];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;

    // Swap elements in state array
    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    // Build payload for reorder API
    const itemsPayload = newItems.map((item, idx) => ({
      course_id: item.course_id,
      order_index: idx
    }));

    try {
      const res = await fetch(`${API_BASE}/api/instructor/course-groups/${selectedGroup.id}/courses/reorder`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ items: itemsPayload })
      });
      const json = await res.json();
      if (res.ok) {
        setGroupCourses(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi sắp xếp.');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '—';
  };

  // Filter groups by search query
  const filteredGroups = groups.filter(g =>
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available courses to add to the selected group:
  // Must be in the same category as the group and not already in the group.
  const groupCoursesIds = groupCourses.map(gc => gc.course_id);
  const eligibleCourses = courses.filter(c =>
    c.categories?.id === selectedGroup?.category_id && 
    !groupCoursesIds.includes(c.id)
  );

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
          <h1 className="font-headline-lg">Quản lý nhóm khóa học</h1>
          <p className="font-body-md text-muted">Nhóm các khóa học của bạn theo danh mục để xây dựng lộ trình học tập hoặc luyện tập.</p>
        </div>
        <div className="mgmt-filters">
          <div className="mgmt-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm"
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Thêm nhóm
          </button>
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải nhóm...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>workspaces</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy nhóm khóa học</h3>
          <p className="font-body-sm text-muted">Tạo nhóm đầu tiên của bạn để bắt đầu sắp xếp chương trình giảng dạy của bạn!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Tạo nhóm
          </button>
        </div>
      ) : (
        /* Groups Card Grid */
        <div className="groups-grid">
          {filteredGroups.map((group) => (
            <div key={group.id} className="group-card card animate-fade-in-up">
              <div className="group-card-header">
                <span className="ic-category-badge">{getCategoryName(group.category_id)}</span>
                <span className="group-order-badge">Index: {group.order_index}</span>
              </div>
              <div className="group-card-body">
                <h3 className="group-title font-headline-sm">{group.title}</h3>
                <p className="group-desc font-body-sm text-muted">
                  {group.description || 'No description provided.'}
                </p>
              </div>
              <div className="group-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => openManageCoursesModal(group)}>
                  <span className="material-symbols-outlined">format_list_bulleted</span>
                  Khóa học trong nhóm
                </button>
                <div className="group-actions">
                  <button className="ic-action-btn" title="Sửa nhóm" onClick={() => openEditModal(group)}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="ic-action-btn ic-delete-btn" title="Xóa nhóm" onClick={() => handleDeleteGroup(group.id)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Group Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingGroup ? 'Cập nhật nhóm khóa học' : 'Thêm nhóm khóa học'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitGroup} className="ic-modal-form">
              <div className="ic-form-grid">
                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Tiêu đề nhóm *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề nhóm..."
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
                  <label className="font-label-md">Thứ tự hiển thị</label>
                  <input
                    className="input-field"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Mô tả</label>
                  <textarea
                    className="input-field ic-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Nhập mô tả chi tiết cho nhóm khóa học..."
                    required
                  />
                </div>
              </div>

              <div className="ic-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Lưu...</>
                  ) : (
                    editingGroup ? 'Cập nhật nhóm' : 'Thêm nhóm'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Group Courses Modal */}
      {selectedGroup && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setSelectedGroup(null)}>
          <div className="ic-modal card animate-fade-in-up manage-courses-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <div>
                <h2 className="font-headline-md">Quản lý nhóm khóa học</h2>
                <p className="font-body-sm text-muted">{selectedGroup.title} ({getCategoryName(selectedGroup.category_id)})</p>
              </div>
              <button className="ic-modal-close" onClick={() => setSelectedGroup(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="manage-courses-body">
              {/* Add Course Form */}
              <form onSubmit={handleAddCourseToGroup} className="add-course-form">
                <div className="acf-fields">
                  <div className="acf-select-wrapper">
                    <label className="font-label-md">Thêm khóa học vào nhóm</label>
                    <select
                      className="input-field"
                      value={newCourseIdToAdd}
                      onChange={(e) => setNewCourseIdToAdd(e.target.value)}
                    >
                      <option value="">Chọn khóa học...</option>
                      {eligibleCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({Number(c.price || 0).toLocaleString('vi-VN')}VNĐ)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="acf-checkbox-wrapper">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={isRequiredForGroup}
                        onChange={(e) => setIsRequiredForGroup(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Khóa học bắt buộc
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary acf-btn" disabled={!newCourseIdToAdd}>
                    <span className="material-symbols-outlined">add</span> Thêm khóa học
                  </button>
                </div>
              </form>

              {/* Group Courses List */}
              <div className="courses-list-header">
                <h4 className="font-headline-sm">Khóa học trong nhóm</h4>
              </div>

              {groupCourses.length === 0 ? (
                <div className="courses-list-empty text-muted">
                  <span className="material-symbols-outlined">menu_book</span>
                  <p>Chưa có khóa học trong nhóm. Thêm khóa học ở trên.</p>
                </div>
              ) : (
                <div className="group-courses-list">
                  {groupCourses.map((item, index) => (
                    <div key={item.course_id} className="group-course-item">
                      <div className="gci-details">
                        <div className="gci-order">{index + 1}</div>
                        <div className="gci-info">
                          <p className="gci-title font-body-sm">{item.courses?.title}</p>
                          <div className="gci-badges">
                            {item.is_required && <span className="badge-required">Khóa học bắt buộc</span>}
                            <span className="badge-level">{(item.courses?.level || 'BEGINNER')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="gci-actions">
                        <div className="gci-reorder-btns">
                          <button
                            type="button"
                            className="reorder-btn"
                            disabled={index === 0}
                            onClick={() => handleReorderCourse(index, 'up')}
                            title="Tăng lên"
                          >
                            <span className="material-symbols-outlined">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            className="reorder-btn"
                            disabled={index === groupCourses.length - 1}
                            onClick={() => handleReorderCourse(index, 'down')}
                            title="Giảm xuống"
                          >
                            <span className="material-symbols-outlined">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          className="gci-remove-btn"
                          onClick={() => handleRemoveCourseFromGroup(item.course_id)}
                          title="Xóa khỏi nhóm"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
