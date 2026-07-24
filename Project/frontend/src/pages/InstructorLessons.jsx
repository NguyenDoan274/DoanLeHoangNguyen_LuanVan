import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../css/InstructorLessons.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorLessons() {
  const { courseId, sectionId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [section, setSection] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order_index: 0,
    is_preview: false
  });
  const [videoFile, setVideoFile] = useState(null);

  // Video Preview State
  const [activePreviewPlaybackId, setActivePreviewPlaybackId] = useState(null);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    if (courseId && sectionId) {
      fetchCourseDetails();
      fetchSectionDetails();
      fetchLessons();
    }
  }, [courseId, sectionId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) setCourse(data);
    } catch {
      showAlert('error', 'Lỗi khi tải thông tin khóa học.');
    }
  };

  const fetchSectionDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (res.ok) setSection(json.data || json);
    } catch {
      showAlert('error', 'Lỗi khi tải thông tin chương học.');
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (res.ok) {
        const list = Array.isArray(json) ? json : (json.data || []);
        const sorted = [...list].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setLessons(sorted);
      } else {
        if (res.status === 404 || json.message?.includes('Không tìm thấy')) {
          setLessons([]);
        } else {
          showAlert('error', json.message || 'Không thể tải danh sách bài học.');
        }
      }
    } catch {
      showAlert('error', 'Lỗi kết nối khi tải bài học.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    const nextIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index || 0)) + 1 : 0;
    setFormData({
      title: '',
      content: '',
      order_index: nextIndex,
      is_preview: false
    });
    setVideoFile(null);
    setEditingLesson(null);
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      content: lesson.content || '',
      order_index: lesson.order_index || 0,
      is_preview: lesson.is_preview || false
    });
    setVideoFile(null);
    setShowModal(true);
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('order_index', formData.order_index.toString());
    fd.append('is_preview', formData.is_preview ? 'true' : 'false');
    if (videoFile) {
      fd.append('video', videoFile);
    }

    try {
      const url = editingLesson
        ? `${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons/${editingLesson.id}`
        : `${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons`;
      const method = editingLesson ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: fd
      });
      const json = await res.json();

      if (res.ok) {
        showAlert('success', editingLesson ? 'Cập nhật bài học thành công!' : 'Tạo bài học thành công!');
        setShowModal(false);
        fetchLessons();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa bài học thành công!');
        fetchLessons();
      } else {
        showAlert('error', json.message || 'Không thể xóa bài học.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const handleReorderLesson = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const lesA = lessons[index];
    const lesB = lessons[targetIndex];

    const valA = lesA.order_index ?? index;
    const valB = lesB.order_index ?? targetIndex;

    const newOrderA = valB === valA ? targetIndex : valB;
    const newOrderB = valB === valA ? index : valA;

    try {
      setLoading(true);
      const resA = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lesA.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderA })
      });
      const resB = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lesB.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderB })
      });

      if (resA.ok && resB.ok) {
        showAlert('success', 'Đã thay đổi thứ tự bài học.');
        fetchLessons();
      } else {
        showAlert('error', 'Cập nhật thứ tự thất bại.');
        fetchLessons();
      }
    } catch {
      showAlert('error', 'Lỗi kết nối khi sắp xếp bài học.');
      fetchLessons();
    }
  };

  const formatDuration = (sec) => {
    if (!sec) return '—';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMuxBadgeClass = (status) => {
    switch (status) {
      case 'READY': return 'mux-ready';
      case 'PROCESSING': return 'mux-processing';
      case 'ERRORED': return 'mux-errored';
      default: return 'mux-no-video';
    }
  };

  const getMuxBadgeText = (status) => {
    switch (status) {
      case 'READY': return 'Ready';
      case 'PROCESSING': return 'Processing...';
      case 'ERRORED': return 'Error';
      default: return 'No Video';
    }
  };

  return (
    <div className="lessons-content container-max">
      {/* Alert Banner */}
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Section Context Header */}
      {section && (
        <div className="section-context-card animate-fade-in-up">
          <div className="section-context-left">
            <div className="section-context-icon">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <div className="section-context-info">
              <span className="ic-category-badge">{course?.title || 'Khóa học'}</span>
              <h2 className="font-headline-sm" style={{ marginTop: 8 }}>Chương: {section.title}</h2>
              <p className="font-body-sm text-muted">{section.description || 'Chương học này chưa có mô tả.'}</p>
            </div>
          </div>
          <Link to={`/instructor/courses/${courseId}/chapters`} className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Chapters
          </Link>
        </div>
      )}

      {/* Header Controls */}
      <div className="mgmt-header animate-fade-in-up delay-100">
        <div className="mgmt-text">
          <h1 className="font-headline-lg">Lessons List</h1>
          <p className="font-body-md text-muted">Create, edit, and manage streaming videos for lessons in this section.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add</span>
          New Lesson
        </button>
      </div>

      {/* Video Preview Panel */}
      {activePreviewPlaybackId && (
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="font-headline-sm">Video Preview</h3>
            <button className="ic-modal-close" onClick={() => setActivePreviewPlaybackId(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="video-preview-panel">
            <video
              controls
              className="video-player-frame"
              poster={`https://image.mux.com/${activePreviewPlaybackId}/thumbnail.jpg?width=640`}
              src={`https://stream.mux.com/${activePreviewPlaybackId}.m3u8`}
            >
              Trình duyệt không hỗ trợ phát HLS trực tiếp. Bạn hãy thử click nút mở cửa sổ mới bên dưới.
            </video>
          </div>
        </div>
      )}

      {/* Loading & Lessons List */}
      {loading ? (
        <div className="ic-loading">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Loading lessons...</span>
        </div>
      ) : lessons.length === 0 ? (
        <div className="ic-empty card animate-fade-in-up delay-200">
          <span className="material-symbols-outlined lessons-empty-icon">smart_display</span>
          <h3 className="font-headline-sm">No lessons found</h3>
          <p className="font-body-sm text-muted">This chapter doesn't have any lessons yet. Add one to get started!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
            <span className="material-symbols-outlined">add</span> Create Lesson
          </button>
        </div>
      ) : (
        <div className="lessons-list animate-fade-in-up delay-200">
          {lessons.map((lesson, index) => (
            <div key={lesson.id} className="lesson-item">
              <div className="lesson-item-left">
                <div className="lesson-index-badge">{index + 1}</div>
                <div className="lesson-item-text">
                  <div className="lesson-title-row">
                    <h3 className="lesson-title font-body-lg">{lesson.title}</h3>
                    {lesson.is_preview && <span className="badge-preview">Preview</span>}
                  </div>
                  <p className="lesson-desc font-body-sm">{lesson.content || 'No text content provided.'}</p>
                </div>
              </div>
              <div className="lesson-item-right">
                {/* Mux Video Status Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`mux-badge ${getMuxBadgeClass(lesson.mux_status)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {lesson.mux_status === 'READY' ? 'play_circle' : lesson.mux_status === 'PROCESSING' ? 'sync' : 'videocam_off'}
                    </span>
                    {getMuxBadgeText(lesson.mux_status)}
                  </span>
                  {lesson.mux_status === 'READY' && (
                    <div className="video-duration">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                      {formatDuration(lesson.duration_sec)}
                    </div>
                  )}
                </div>

                {/* Preview Trigger */}
                {lesson.mux_status === 'READY' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setActivePreviewPlaybackId(lesson.mux_playback_id)}
                  >
                    <span className="material-symbols-outlined">play_arrow</span> Play
                  </button>
                )}

                {/* Reordering Actions */}
                <div className="reorder-actions">
                  <button
                    className="reorder-btn"
                    disabled={index === 0}
                    onClick={() => handleReorderLesson(index, 'up')}
                    title="Move Lesson Up"
                  >
                    <span className="material-symbols-outlined">arrow_upward</span>
                  </button>
                  <button
                    className="reorder-btn"
                    disabled={index === lessons.length - 1}
                    onClick={() => handleReorderLesson(index, 'down')}
                    title="Move Lesson Down"
                  >
                    <span className="material-symbols-outlined">arrow_downward</span>
                  </button>
                </div>

                {/* Action controls */}
                <div className="chapter-actions">
                  <button className="ic-action-btn" title="Edit" onClick={() => openEditModal(lesson)}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="ic-action-btn ic-delete-btn" title="Delete" onClick={() => handleDeleteLesson(lesson.id)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lesson Modal Dialog */}
      {showModal && (
        <div className="ic-modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h2 className="font-headline-md">{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
              <button className="ic-modal-close" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitLesson} className="ic-modal-form">
              <div className="ic-form-grid">
                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Lesson Title *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter lesson title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="ic-form-group">
                  <label className="font-label-md">Order Index</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="ic-form-group" style={{ justifyContent: 'center' }}>
                  <label className="checkbox-container" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_preview}
                      onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Allow free preview (Học viên học thử)
                  </label>
                </div>

                <div className="ic-form-group ic-form-full">
                  <label className="font-label-md">Text Content / Description</label>
                  <textarea
                    className="input-field ic-textarea"
                    placeholder="Provide a written lecture or description of the lesson content..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                {/* Video Upload Field */}
                <div className="ic-form-group ic-form-full video-upload-section">
                  <label className="font-label-md">Lesson Video (Mux Streaming)</label>
                  <input
                    type="file"
                    accept="video/*"
                    id="lesson-video"
                    className="ic-file-input"
                    onChange={(e) => setVideoFile(e.target.files[0] || null)}
                  />
                  <label htmlFor="lesson-video" className="video-upload-label">
                    <span className="material-symbols-outlined">video_library</span>
                    <span className="video-upload-text">
                      {videoFile ? videoFile.name : 'Choose video file (MP4, MKV, AVI, WEBM)...'}
                    </span>
                    <span className="video-upload-subtext">
                      Maximum size 100MB. Video will be processed by Mux automatically.
                    </span>
                  </label>
                </div>
              </div>

              <div className="ic-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span> Saving & Uploading...
                    </>
                  ) : editingLesson ? (
                    'Update Lesson'
                  ) : (
                    'Create Lesson'
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
