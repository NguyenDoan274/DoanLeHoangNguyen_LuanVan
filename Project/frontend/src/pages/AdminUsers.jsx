import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminUsers.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminUsers() {
  const { user: currentUser } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    avatar_url: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  // Fetch users with search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `${API_BASE}/api/admin/users?name=${encodeURIComponent(query)}`
        : `${API_BASE}/api/admin/users`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok) {
        setUsers(json.data || []);
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'STUDENT',
      status: 'ACTIVE',
      avatar_url: ''
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      full_name: u.full_name || '',
      email: u.email || '',
      password: '', // Leave empty unless modifying
      role: u.role || 'STUDENT',
      status: u.status || 'ACTIVE',
      avatar_url: u.avatar_url || ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Prepare payload
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      avatar_url: formData.avatar_url || null
    };

    if (!editingUser) {
      payload.password = formData.password;
    } else if (formData.password) {
      payload.password = formData.password; // optional on update
    }

    try {
      const url = editingUser
        ? `${API_BASE}/api/admin/users/${editingUser.id}`
        : `${API_BASE}/api/admin/users`;
      const method = editingUser ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', editingUser ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchUsers(searchQuery);
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBanUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa tài khoản này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Đã vô hiệu hóa tài khoản.');
        fetchUsers(searchQuery);
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const handleToggleUserStatus = async (userToToggle) => {
    const nextStatus = userToToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userToToggle.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Cập nhật trạng thái thành công.');
        fetchUsers(searchQuery);
      } else {
        showAlert('error', json.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối.');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'INSTRUCTOR': return 'badge-instructor';
      default: return 'badge-student';
    }
  };

  const getStatusTextClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-active';
      case 'BANNED': return 'text-banned';
      default: return 'text-inactive';
    }
  };

  const getAvatarUrl = (u) => {
    if (!u.avatar_url) return defaultAvatar;
    return u.avatar_url.startsWith('http') ? u.avatar_url : `${API_BASE}${u.avatar_url}`;
  };

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
          <h1 className="font-headline-lg">Quản lý người dùng</h1>
          <p className="font-body-md text-muted">Thêm, sửa, cấm hoặc tạm dừng tài khoản người dùng trên EduPro.</p>
        </div>
        <div className="header-filters">
          <div className="search-filter" style={{ marginRight: 16 }}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-body-sm" 
            />
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span>
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Table / Loading State */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải người dùng...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>group</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}> Không tìm thấy người dùng</h3>
          <p className="font-body-sm text-muted">Thử tìm kiếm người dùng hoặc tạo một người dùng mới.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Thêm người dùng
          </button>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Thông tin người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Trạng thái tài khoản</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="course-row">
                    <td>
                      <div className="course-detail-cell">
                        <img src={getAvatarUrl(u)} alt={u.full_name} className="user-thumbnail" onError={(e) => { e.target.src = defaultAvatar; }} />
                        <div>
                          <p className="course-title font-body-md" style={{ margin: 0 }}>{u.full_name}</p>
                          <p className="course-updated" style={{ margin: 0 }}>ID: {u.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-body-sm">{u.email}</span>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>{u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}</span>
                    </td>
                    <td>
                      <div className="status-cell">
                        <div className={`status-dot status-${u.status.toLowerCase()}`}></div>
                        <span className={`status-text ${getStatusTextClass(u.status)}`}>{u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'INACTIVE' ? 'Không hoạt động' : 'Vô hiệu hóa'}</span>
                      </div>
                    </td>
                    <td>
                      {/* Active / Inactive switch */}
                      <label className="toggle-switch-wrapper">
                        <input
                          type="checkbox"
                          checked={u.status === 'ACTIVE'}
                          onChange={() => handleToggleUserStatus(u)}
                          disabled={u.id === currentUser?.id}
                        />
                        <div className="toggle-slider"></div>
                      </label>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: 10 }}>
                        <button className="action-icon-btn" title="Cập nhật" onClick={() => openEditModal(u)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button 
                          className="action-icon-btn text-error" 
                          title="Vô hiệu hóa tài khoản" 
                          onClick={() => handleBanUser(u.id)}
                          disabled={u.id === currentUser?.id || u.status === 'BANNED'}
                        >
                          <span className="material-symbols-outlined" style={{ color: u.status === 'BANNED' ? '#c4c5d5' : 'var(--error)' }}>
                            block
                          </span>
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

      {/* User Form Modal */}
      {showCreateModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingUser ? 'Cập nhật hồ sơ người dùng' : 'Tạo tài khoản người dùng mới'}</h2>
              <button className="ic-modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitUser} className="ic-modal-form">
              <div className="ic-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="ic-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="font-label-md">Họ và tên *</label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nhập họ tên..."
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Email *</label>
                  <input
                    className="input-field"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Nhập email..."
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">
                    {editingUser ? 'Mật khẩu mới (tùy chọn)' : 'Mật khẩu *'}
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••':'Nhập mật khẩu...'}
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Quyền hạn *</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Trạng thái tài khoản *</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    disabled={editingUser?.id === currentUser?.id}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="BANNED">Cấm</option>
                  </select>
                </div>
              </div>

              <div className="ic-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Lưu...</>
                  ) : (
                    editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản'
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
