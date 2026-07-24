import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../css/AdminCourses.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function AdminCourses() {
  const { user } = useOutletContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selected course for detail view
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Alert message
  const [alert, setAlert] = useState({ type: '', message: '' });

  const defaultCourseImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGSpGryH5JBDUKOIc_FODiLFydKeDawQ9HO-QVYcOAKX6f5zmDlosrKzX2mqSpyNmH28OXdSSyksGb8d9KQHVlP9cQJHfGtAy4xNMUuugNmcy6RqS9oc9QTGlBrJysvHg0qlVEiGEEiZA5tHxVHKRautRmKZtP3Rv-jRUGu7dun5gzHEHE9gP6mqeBow262xuodtjsAue-ZRyCJc5mVwp52HYh0D8O8I9oL9fbYei_US0A6yvgjrOoa1TtvdXHS7wdYWYxkxDvfAo';

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setCourses(json.data || []);
      } else {
        showAlert('error', json.message || 'Lỗi tải danh sách khóa học.');
      }
    } catch (e) {
      showAlert('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRecommend = async (course) => {
    const nextRecommend = !course.is_recommend;
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_recommend: nextRecommend })
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', `Đã ${nextRecommend ? 'đề xuất' : 'hủy đề xuất'} khóa học thành công.`);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_recommend: nextRecommend } : c));
        if (selectedCourse && selectedCourse.id === course.id) {
          setSelectedCourse(prev => ({ ...prev, is_recommend: nextRecommend }));
        }
      } else {
        showAlert('error', json.message || 'Cập nhật đề xuất thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const handleToggleStatus = async (course) => {
    const nextStatus = course.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', `Đã chuyển trạng thái khóa học sang ${nextStatus === 'PUBLISHED' ? 'Công khai' : 'Ẩn'}.`);
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: nextStatus } : c));
        if (selectedCourse && selectedCourse.id === course.id) {
          setSelectedCourse(prev => ({ ...prev, status: nextStatus }));
        }
      } else {
        showAlert('error', json.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const handleViewDetail = async (id) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    setSelectedCourse(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${id}`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setSelectedCourse(json);
      } else {
        showAlert('error', json.message || 'Không thể tải chi tiết khóa học.');
        setShowDetailModal(false);
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || course.status === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  const getCourseImage = (c) => {
    if (!c.thumbnail_url) return defaultCourseImage;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  const formatPrice = (price) => {
    return price ? `${parseFloat(price).toLocaleString('vi-VN')} VNĐ` : 'Miễn phí';
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
          <h1 className="font-headline-lg">Quản lý khóa học</h1>
          <p className="font-body-md text-muted">Quản lý tất cả các khóa học,toggle trạng thái đề xuất, và công khai hoặc ẩn các khóa học</p>
        </div>
        <div className="header-filters">
          <div className="search-filter">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, danh mục, giảng viên..." 
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
            <option value="All">Tất cả</option>
            <option value="Published">Xuất bản</option>
            <option value="Draft">Nháp</option>
            <option value="Hidden">Ẩn</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="stats-overview">
        <div className="stat-card card">
          <div className="stat-icon bg-blue">
            <span className="material-symbols-outlined">library_books</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Tổng số khóa học</p>
            <h3 className="stat-value">{loading ? '...' : courses.length}</h3>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon bg-green">
            <span className="material-symbols-outlined">star</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Khóa học được đề xuất</p>
            <h3 className="stat-value">{loading ? '...' : courses.filter(c => c.is_recommend).length}</h3>
          </div>
        </div>
      </section>

      {/* Course Table Layout */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Đang tải...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="ic-empty card">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>library_books</span>
          <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy khóa học</h3>
          <p className="font-body-sm text-muted">Hãy thử tìm kiếm với một tên khác hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="course-table-wrapper card">
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Thông tin khóa học</th>
                  <th style={{ width: '12%' }}>Danh mục</th>
                  <th style={{ width: '10%' }}>Giá</th>
                  <th style={{ width: '10%' }}>Cấp độ</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>Đề xuất</th>
                  <th style={{ width: '12%' }}>Trạng thái</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="course-row">
                    <td>
                      <div className="course-detail-cell">
                        <img src={getCourseImage(course)} alt={course.title} className="course-thumb" />
                        <div>
                          <p className="course-title font-body-md" style={{ margin: 0 }}>{course.title}</p>
                          <p className="course-updated" style={{ margin: 0 }}>
                            Giảng viên: <strong style={{ color: 'var(--on-surface)' }}>{course.users?.full_name || 'Chưa có'}</strong>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{course.categories?.name || 'Không có'}</span>
                    </td>
                    <td>
                      <p className="course-price" style={{ margin: 0 }}>{formatPrice(course.price)}</p>
                    </td>
                    <td>
                      <span className={`level-badge level-${course.level.toLowerCase()}`}>{course.level}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label className="toggle-switch-wrapper">
                        <input
                          type="checkbox"
                          checked={course.is_recommend || false}
                          onChange={() => handleToggleRecommend(course)}
                        />
                        <div className="toggle-slider"></div>
                      </label>
                    </td>
                    <td>
                      <div className="status-cell">
                        <div className={`status-dot status-${course.status.toLowerCase()}`}></div>
                        <span className={`status-text text-${course.status.toLowerCase()}`}>{course.status}</span>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="action-icon-btn" 
                          title="View Course Details"
                          onClick={() => handleViewDetail(course.id)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <label className="toggle-switch-wrapper" title="Xuất bản/Ẩn ">
                          <input
                            type="checkbox"
                            checked={course.status === 'PUBLISHED'}
                            onChange={() => handleToggleStatus(course)}
                          />
                          <div className="toggle-slider"></div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="table-pagination">
            <p className="pagination-info">
              Hiển thị <strong>1-{filteredCourses.length}</strong> trên <strong>{filteredCourses.length}</strong> khóa học
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">Chi tiết khóa học</h2>
              <button className="ic-modal-close" onClick={() => setShowDetailModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {loadingDetail ? (
              <div className="ic-loading" style={{ minHeight: 300 }}>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>Đang tải thông tin khóa học...</span>
              </div>
            ) : !selectedCourse ? (
              <div className="ic-empty" style={{ minHeight: 300 }}>
                <p className="font-body-md text-muted">Lấy thông tin khóa học thất bại hoặc khóa học không tồn tại.</p>
              </div>
            ) : (
              <div className="course-detail-modal-body">
                {/* Header block */}
                <div className="detail-header-block">
                  <img 
                    src={getCourseImage(selectedCourse)} 
                    alt={selectedCourse.title} 
                    className="detail-modal-thumb" 
                  />
                  <div className="detail-header-info">
                    <h3 className="font-headline-sm" style={{ margin: 0 }}>{selectedCourse.title}</h3>
                    <p className="font-body-sm text-muted" style={{ margin: 0, marginTop: 4 }}>
                      {selectedCourse.short_description || 'Không có mô tả ngắn'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <span className="category-badge" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {selectedCourse.categories?.name || 'N/A'}
                      </span>
                      <span className={`level-badge level-${selectedCourse.level?.toLowerCase()}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                        {selectedCourse.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail Grid */}
                <div className="detail-grid">
                  {/* Left Column: Description & Syllabus */}
                  <div className="detail-main">
                    <div>
                      <h4 className="font-title-md" style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Mô tả</h4>
                      <p className="font-body-sm text-muted" style={{ whiteSpace: 'pre-line', margin: 0, lineHeight: 1.5 }}>
                        {selectedCourse.description || 'Không có mô tả'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-title-md" style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
                        Tổng ({selectedCourse.course_sections?.length || 0} chương)
                      </h4>
                      {selectedCourse.course_sections?.length === 0 ? (
                        <p className="font-body-sm text-muted italic" style={{ margin: 0 }}>Chưa có chương học.</p>
                      ) : (
                        selectedCourse.course_sections?.map((section, sIndex) => (
                          <div key={section.id} className="syllabus-section-card">
                            <div className="syllabus-section-header">
                              <span>Chương {sIndex + 1}: {section.title}</span>
                              <span className="font-body-sm text-muted">{section.lessons?.length || 0} Bài học</span>
                            </div>
                            <div className="syllabus-lessons-list">
                              {section.lessons?.length === 0 ? (
                                <p className="font-body-sm text-muted italic" style={{ padding: '8px 16px', margin: 0 }}>
                                  Không có bài học trong chương này.
                                </p>
                              ) : (
                                section.lessons?.map((lesson, lIndex) => (
                                  <div key={lesson.id} className="syllabus-lesson-item">
                                    <div className="syllabus-lesson-left">
                                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>
                                        {lesson.mux_playback_id ? 'play_circle' : 'article'}
                                      </span>
                                      <span>Lesson {lIndex + 1}: {lesson.title}</span>
                                    </div>
                                    <div className="syllabus-lesson-right">
                                      {lesson.duration_sec ? `${Math.floor(lesson.duration_sec / 60)}m ${lesson.duration_sec % 60}s` : ''}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Sidebar Info */}
                  <div className="detail-sidebar">
                    <div className="detail-info-row">
                      <span className="detail-info-label">Giảng viên</span>
                      <span className="detail-info-value">{selectedCourse.users?.full_name || 'N/A'}</span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Giá</span>
                      <span className="detail-info-value text-primary font-bold">{formatPrice(selectedCourse.price)}</span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Trạng thái</span>
                      <span className={`font-bold text-${selectedCourse.status?.toLowerCase()}`}>{selectedCourse.status}</span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Đề xuất</span>
                      <span className="detail-info-value">
                        <label className="toggle-switch-wrapper">
                          <input 
                            type="checkbox"
                            checked={selectedCourse.is_recommend || false}
                            onChange={() => handleToggleRecommend(selectedCourse)}
                          />
                          <div className="toggle-slider"></div>
                        </label>
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Xuất bản</span>
                      <span className="detail-info-value">
                        <label className="toggle-switch-wrapper">
                          <input 
                            type="checkbox"
                            checked={selectedCourse.status === 'PUBLISHED'}
                            onChange={() => handleToggleStatus(selectedCourse)}
                          />
                          <div className="toggle-slider"></div>
                        </label>
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-info-label">Ngày tạo</span>
                      <span className="detail-info-value">
                        {selectedCourse.created_at ? new Date(selectedCourse.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
