import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import CourseEditModal from '../components/CourseEditModal';
import ChapterModal from '../components/ChapterModal';
import LessonModal from '../components/LessonModal';
import '../css/InstructorChapters.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function InstructorChapters() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext(); // Get current logged-in instructor

  // Page States
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [expandedSectionIds, setExpandedSectionIds] = useState({});
  const [activePreviewPlaybackId, setActivePreviewPlaybackId] = useState(null);

  // Modal display toggles
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // Submitting loaders
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [chapterSubmitting, setChapterSubmitting] = useState(false);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  // Target objects for editing
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonModalSectionId, setLessonModalSectionId] = useState(null);

  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      fetchCategories();
    }
  }, [courseId]);

  useEffect(() => {
    // Nếu có bài học nào đang PROCESSING, thực hiện poll mỗi 5 giây
    let intervalId;
    const hasProcessingLesson = course?.course_sections?.some(section =>
      section.lessons?.some(lesson => lesson.mux_status === 'PROCESSING')
    );

    if (hasProcessingLesson) {
      intervalId = setInterval(() => {
        fetchCourseDetails(true);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [course]);

  const fetchCourseDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setCourse(data);
      } else {
        if (!silent) showAlert('error', data.message || 'Không thể tải thông tin khóa học.');
      }
    } catch {
      if (!silent) showAlert('error', 'Lỗi kết nối khi tải chi tiết khóa học.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instructor/categories`, {
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setCategories(Array.isArray(json) ? json : (json.data || []));
      }
    } catch { /* ignore */ }
  };

  const toggleSection = (sectionId) => {
    setExpandedSectionIds(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getThumbnailUrl = (c) => {
    if (!c || !c.thumbnail_url) return null;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  const formatDuration = (sec) => {
    if (!sec) return '—';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // ── COURSE ACTIONS ──

  const handleUpdateCourseStatus = async (newStatus) => {
    if (!course) return;
    const fd = new FormData();
    fd.append('title', course.title);
    fd.append('category_id', course.category_id);
    fd.append('status', newStatus);
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: fd
      });
      if (res.ok) {
        showAlert('success', `Cập nhật trạng thái khóa học thành ${newStatus}!`);
        fetchCourseDetails();
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Thay đổi trạng thái thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối server.');
    }
  };

  const handleSubmitCourseDetails = async (formData, thumbnailFile) => {
    setCourseSubmitting(true);
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('short_description', formData.short_description);
    fd.append('description', formData.description);
    fd.append('category_id', formData.category_id);
    fd.append('level', formData.level);
    fd.append('price', formData.price.toString());
    fd.append('status', formData.status);
    if (thumbnailFile) {
      fd.append('thumbnail', thumbnailFile);
    }

    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: fd
      });
      if (res.ok) {
        showAlert('success', 'Cập nhật thông tin khóa học thành công!');
        setShowCourseModal(false);
        fetchCourseDetails();
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Cập nhật khóa học thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối server.');
    } finally {
      setCourseSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Đã xóa khóa học thành công.');
        navigate('/instructor/courses');
      } else {
        showAlert('error', data.message || 'Xóa khóa học thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối server.');
    }
  };

  // ── CHAPTER (SECTION) ACTIONS ──

  const openCreateChapterModal = () => {
    setEditingChapter(null);
    setShowChapterModal(true);
  };

  const openEditChapterModal = (section) => {
    setEditingChapter(section);
    setShowChapterModal(true);
  };

  const handleSubmitChapter = async (formData) => {
    setChapterSubmitting(true);
    try {
      const url = editingChapter
        ? `${API_BASE}/api/instructor/courses/${courseId}/sections/${editingChapter.id}`
        : `${API_BASE}/api/instructor/courses/${courseId}/sections`;
      const method = editingChapter ? 'PATCH' : 'POST';

      // Automatically calculate order index for new chapters
      const bodyPayload = { ...formData };
      if (!editingChapter) {
        const sections = course.course_sections || [];
        const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index || 0)) + 1 : 0;
        bodyPayload.order_index = nextOrder;
      }

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const json = await res.json();

      if (res.ok) {
        showAlert('success', editingChapter ? 'Cập nhật chương học thành công!' : 'Tạo chương học thành công!');
        setShowChapterModal(false);
        fetchCourseDetails();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối đến máy chủ.');
    } finally {
      setChapterSubmitting(false);
    }
  };

  const handleDeleteChapter = async (sectionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương học này không? Cảnh báo: Chỉ có thể xóa chương học rỗng không chứa bài học.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa chương học thành công!');
        fetchCourseDetails();
      } else {
        showAlert('error', json.message || 'Không thể xóa chương học này.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const handleReorderChapter = async (index, direction) => {
    const sections = course.course_sections || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const secA = sections[index];
    const secB = sections[targetIndex];

    const valA = secA.order_index ?? index;
    const valB = secB.order_index ?? targetIndex;

    const newOrderA = valB === valA ? targetIndex : valB;
    const newOrderB = valB === valA ? index : valA;

    try {
      const resA = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${secA.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderA })
      });
      const resB = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${secB.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderB })
      });

      if (resA.ok && resB.ok) {
        showAlert('success', 'Đã thay đổi thứ tự chương học.');
        fetchCourseDetails();
      } else {
        showAlert('error', 'Cập nhật thứ tự chương học thất bại.');
        fetchCourseDetails();
      }
    } catch {
      showAlert('error', 'Lỗi kết nối khi sắp xếp chương học.');
      fetchCourseDetails();
    }
  };

  // ── LESSON ACTIONS ──

  const openCreateLessonModal = (sectionId) => {
    setLessonModalSectionId(sectionId);
    setEditingLesson(null);
    setShowLessonModal(true);
  };

  const openEditLessonModal = (sectionId, lesson) => {
    setLessonModalSectionId(sectionId);
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const handleSubmitLesson = async (formData, videoFile) => {
    setLessonSubmitting(true);

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('is_preview', formData.is_preview ? 'true' : 'false');
    if (videoFile) {
      fd.append('video', videoFile);
    }

    // Automatically calculate order index for new lessons
    if (!editingLesson) {
      const parentSection = (course.course_sections || []).find(s => s.id === lessonModalSectionId);
      const lessons = parentSection?.lessons || [];
      const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index || 0)) + 1 : 0;
      fd.append('order_index', nextOrder.toString());
    } else {
      fd.append('order_index', (editingLesson.order_index || 0).toString());
    }

    try {
      const url = editingLesson
        ? `${API_BASE}/api/instructor/courses/${courseId}/sections/${lessonModalSectionId}/lessons/${editingLesson.id}`
        : `${API_BASE}/api/instructor/courses/${courseId}/sections/${lessonModalSectionId}/lessons`;
      const method = editingLesson ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: fd
      });
      const json = await res.json();

      if (res.ok) {
        showAlert('success', editingLesson ? 'Cập nhật bài học thành công!' : 'Tạo bài học thành công!');
        setShowLessonModal(false);
        fetchCourseDetails();
      } else {
        showAlert('error', json.message || 'Thao tác thất bại.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('success', 'Xóa bài học thành công!');
        fetchCourseDetails();
      } else {
        showAlert('error', json.message || 'Không thể xóa bài học.');
      }
    } catch {
      showAlert('error', 'Lỗi kết nối máy chủ.');
    }
  };



  const handleReorderLesson = async (section, index, direction) => {
    const lessons = section.lessons || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const lesA = lessons[index];
    const lesB = lessons[targetIndex];

    const valA = lesA.order_index ?? index;
    const valB = lesB.order_index ?? targetIndex;

    const newOrderA = valB === valA ? targetIndex : valB;
    const newOrderB = valB === valA ? index : valA;

    try {
      const resA = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${section.id}/lessons/${lesA.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderA })
      });
      const resB = await fetch(`${API_BASE}/api/instructor/courses/${courseId}/sections/${section.id}/lessons/${lesB.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrderB })
      });

      if (resA.ok && resB.ok) {
        showAlert('success', 'Đã thay đổi thứ tự bài học.');
        fetchCourseDetails();
      } else {
        showAlert('error', 'Cập nhật thứ tự thất bại.');
        fetchCourseDetails();
      }
    } catch {
      showAlert('error', 'Lỗi kết nối khi sắp xếp bài học.');
      fetchCourseDetails();
    }
  };

  const getMuxBadgeClass = (status) => {
    switch (status) {
      case 'READY': return 'status-badge-ready';
      case 'PROCESSING': return 'status-badge-processing';
      case 'ERRORED': return 'status-badge-errored';
      default: return 'status-badge-no_video';
    }
  };

  const getMuxBadgeText = (status) => {
    switch (status) {
      case 'READY': return 'READY';
      case 'PROCESSING': return 'PROCESSING (Đang xử lý...)';
      case 'ERRORED': return 'ERRORED';
      default: return 'NO VIDEO';
    }
  };

  const countTotalLessons = () => {
    if (!course || !course.course_sections) return 0;
    return course.course_sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  };

  const countTotalDuration = () => {
    if (!course || !course.course_sections) return 0;
    let totalSec = 0;
    course.course_sections.forEach(s => {
      if (s.lessons) {
        s.lessons.forEach(l => {
          totalSec += (l.duration_sec || 0);
        });
      }
    });
    if (totalSec === 0) return '0 phút';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.ceil((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} phút`;
  };

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`)
    : defaultAvatar;

  return (
    <div className="container-max" style={{ paddingBottom: '80px' }}>
      {/* Alerts */}
      {alert.message && (
        <div className={`ic-alert ic-alert-${alert.type} animate-fade-in`}>
          <span className="material-symbols-outlined">{alert.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {loading ? (
        <div className="ic-loading" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>sync</span>
          <span>Loading course content...</span>
        </div>
      ) : !course ? (
        <div className="ic-empty card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--outline)' }}>warning</span>
          <h3 className="font-headline-sm" style={{ marginTop: '16px' }}>Course Not Found</h3>
          <p className="font-body-sm text-muted">Không tìm thấy khóa học này trong hệ thống.</p>
          <Link to="/instructor/courses" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Courses</Link>
        </div>
      ) : (
        <div className="course-detail-container">
          
          {/* LEFT COLUMN: Main details & Curriculum */}
          <div className="detail-main-content">
            
            {/* Hero details card */}
            <section className="course-hero-section animate-fade-in-up">
              <div className="tag-badges-row">
                <span className="tag-badge primary-tag">{course.categories?.name || 'Category'}</span>
                <span className="tag-badge secondary-tag">{course.level === 'ADVANCED' ? 'Nâng cao' : course.level === 'INTERMEDIATE' ? 'Trung cấp' : 'Mới bắt đầu'}</span>
              </div>
              <h1 className="course-hero-title">{course.title}</h1>
              <p className="course-hero-desc">{course.short_description || 'Khóa học này chưa có mô tả ngắn.'}</p>
              
              <div className="instructor-meta-row">
                <img src={avatarUrl} alt={user?.full_name} className="instructor-avatar" />
                <div className="instructor-info">
                  <span className="instructor-label">Giảng viên</span>
                  <span className="instructor-name">{user?.full_name || 'Instructor'}</span>
                </div>
              </div>
            </section>

            {/* Curriculum Accordion */}
            <section className="space-y-6 animate-fade-in-up delay-100">
              <div className="curriculum-header">
                <div>
                  <h2 className="font-headline-md">Nội dung khóa học</h2>
                </div>
                <span className="curriculum-summary">
                  {course.course_sections?.length || 0} chương • {countTotalLessons()} bài học • {countTotalDuration()} tổng cộng
                </span>
              </div>

              {/* Accordions */}
              {(!course.course_sections || course.course_sections.length === 0) ? (
                <div className="empty-curriculum-box">
                  <span className="material-symbols-outlined empty-icon-lg">list_alt</span>
                  <h3 className="font-headline-sm">Chưa có chương học nào</h3>
                  <p className="font-body-sm text-muted">Hãy thêm chương học đầu tiên cho khóa học này của bạn!</p>
                  <button className="btn btn-primary btn-sm" onClick={openCreateChapterModal}>
                    <span className="material-symbols-outlined">add</span> Thêm chương học
                  </button>
                </div>
              ) : (
                <div className="chapters-accordion-wrapper">
                  {course.course_sections.map((section, index) => {
                    const isExpanded = !!expandedSectionIds[section.id];
                    return (
                      <div key={section.id} className={`chapter-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                        {/* Header Row */}
                        <div className="chapter-accordion-header" onClick={() => toggleSection(section.id)}>
                          <div className="chapter-header-left">
                            <span className="material-symbols-outlined accordion-arrow">expand_more</span>
                            <div className="chapter-header-info">
                              <h3 className="chapter-header-title">Chương {index + 1}: {section.title}</h3>
                              {section.description && <p className="chapter-header-desc">{section.description}</p>}
                            </div>
                          </div>
                          
                          <div className="chapter-header-right" onClick={(e) => e.stopPropagation()}>
                            <span className="lessons-count-badge">{section.lessons?.length || 0} bài học</span>
                            
                            <div className="chapter-header-actions">
                              {/* Reorder Up */}
                              <button
                                className="icon-action-button"
                                disabled={index === 0}
                                onClick={() => handleReorderChapter(index, 'up')}
                                title="Di chuyển lên"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
                              </button>
                              {/* Reorder Down */}
                              <button
                                className="icon-action-button"
                                disabled={index === course.course_sections.length - 1}
                                onClick={() => handleReorderChapter(index, 'down')}
                                title="Di chuyển xuống"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_downward</span>
                              </button>
                              {/* Add Lesson */}
                              <button
                                className="icon-action-button"
                                onClick={() => openCreateLessonModal(section.id)}
                                title="Thêm bài học mới"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
                              </button>
                              {/* Edit */}
                              <button
                                className="icon-action-button"
                                onClick={() => openEditChapterModal(section)}
                                title="Sửa chương học"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                              </button>
                              {/* Delete */}
                              <button
                                className="icon-action-button delete-action"
                                onClick={() => handleDeleteChapter(section.id)}
                                title="Xóa chương học"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Lessons Content Panel */}
                        <div className="chapter-accordion-content">
                          <div className="lessons-list-inner">
                            {(!section.lessons || section.lessons.length === 0) ? (
                              <div className="lessons-empty-text">
                                Chương học này chưa có bài học nào. Click biểu tượng <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>add_circle</span> để thêm bài học.
                              </div>
                            ) : (
                              section.lessons.map((lesson, lIndex) => (
                                <div key={lesson.id} className="lesson-row-item">
                                  <div className="lesson-row-left">
                                    <span className="material-symbols-outlined lesson-play-icon">play_circle</span>
                                    <div className="lesson-details">
                                      <div className="lesson-title-container">
                                        <span className="lesson-title-text">Bài {lIndex + 1}. {lesson.title}</span>
                                        {lesson.is_preview && <span className="preview-pill">Học thử</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="lesson-row-right">
                                    {/* Mux Video Badges */}
                                    <span className={`video-status-indicator ${getMuxBadgeClass(lesson.mux_status)}`}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                        {lesson.mux_status === 'READY' ? 'check_circle' : lesson.mux_status === 'PROCESSING' ? 'autorenew' : 'videocam_off'}
                                      </span>
                                      {getMuxBadgeText(lesson.mux_status)}
                                    </span>

                                    {/* Duration info */}
                                    {lesson.mux_status === 'READY' && lesson.duration_sec && (
                                      <div className="duration-info">
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                                        {formatDuration(lesson.duration_sec)}
                                      </div>
                                    )}

                                    {/* Preview Play Trigger */}
                                    {lesson.mux_status === 'READY' && (
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '4px 12px', fontSize: '12px' }}
                                        onClick={() => setActivePreviewPlaybackId(lesson.mux_playback_id)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span> Xem
                                      </button>
                                    )}

                                    {/* Reorder Buttons */}
                                    <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid var(--outline-variant)', paddingRight: '8px' }}>
                                      <button
                                        className="icon-action-button"
                                        disabled={lIndex === 0}
                                        onClick={() => handleReorderLesson(section, lIndex, 'up')}
                                        title="Di chuyển lên"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_upward</span>
                                      </button>
                                      <button
                                        className="icon-action-button"
                                        disabled={lIndex === section.lessons.length - 1}
                                        onClick={() => handleReorderLesson(section, lIndex, 'down')}
                                        title="Di chuyển xuống"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
                                      </button>
                                    </div>

                                    {/* Edit / Delete */}
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button
                                        className="icon-action-button"
                                        onClick={() => openEditLessonModal(section.id, lesson)}
                                        title="Sửa bài học"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                                      </button>
                                      <button
                                        className="icon-action-button delete-action"
                                        onClick={() => handleDeleteLesson(section.id, lesson.id)}
                                        title="Xóa bài học"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Video Preview Panel (only visible when a READY lesson is clicked) */}
            {activePreviewPlaybackId && (
              <section className="video-preview-card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="font-headline-sm" style={{ color: 'var(--primary)', margin: 0 }}>Xem trước bài học</h3>
                  <button className="icon-action-button" onClick={() => setActivePreviewPlaybackId(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="video-frame-wrapper">
                  <video
                    controls
                    className="video-player-tag"
                    poster={`https://image.mux.com/${activePreviewPlaybackId}/thumbnail.jpg?width=640`}
                    src={`https://stream.mux.com/${activePreviewPlaybackId}.m3u8`}
                    autoPlay
                  >
                    Trình duyệt không hỗ trợ phát HLS trực tiếp.
                  </video>
                </div>
              </section>
            )}

            {/* Detailed Description */}
            <section className="description-section animate-fade-in-up delay-200">
              <h2 className="font-headline-md">Mô tả khóa học</h2>
              <div className="description-body">
                {course.description || 'Khóa học này chưa có thông tin chi tiết đầy đủ.'}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar for management */}
          <aside className="animate-fade-in-up">
            <div className="sidebar-card">
              {/* Thumbnail Display */}
              <div className="sidebar-thumbnail-box">
                {getThumbnailUrl(course) ? (
                  <img src={getThumbnailUrl(course)} alt={course.title} className="sidebar-thumb-image" />
                ) : (
                  <div className="sidebar-thumb-placeholder">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>image</span>
                    <span className="font-body-sm">Chưa có ảnh bìa</span>
                  </div>
                )}
              </div>

              {/* Sidebar Info & Controls */}
              <div className="sidebar-body">
                <div className="sidebar-status-price-row">
                  <span className="sidebar-price">{Number(course.price || 0).toLocaleString('vi-VN')} VNĐ</span>

                  {/* Status Badge */}
                  <span className={`course-status-badge badge-${(course.status || 'draft').toLowerCase()}`}>
                    {course.status || 'DRAFT'}
                  </span>
                </div>

                {/* Course Metadata statistics */}
                <div className="sidebar-stats-list">
                  <div className="sidebar-stat-item">
                    <span className="stat-item-label">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
                      Chương học
                    </span>
                    <span className="stat-item-value">{course.course_sections?.length || 0}</span>
                  </div>
                  
                  <div className="sidebar-stat-item">
                    <span className="stat-item-label">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span>
                      Bài học
                    </span>
                    <span className="stat-item-value">{countTotalLessons()}</span>
                  </div>

                  <div className="sidebar-stat-item">
                    <span className="stat-item-label">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
                      Thời lượng
                    </span>
                    <span className="stat-item-value">{countTotalDuration()}</span>
                  </div>

                  <div className="sidebar-stat-item">
                    <span className="stat-item-label">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
                      Cập nhật
                    </span>
                    <span className="stat-item-value">{new Date(course.updated_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Administrative Actions stacked */}
                <div className="sidebar-actions-stack">
                  
                  {/* DRAFT -> Publish button */}
                  {course.status === 'DRAFT' && (
                    <button className="btn btn-conversion sidebar-btn" onClick={() => handleUpdateCourseStatus('PUBLISHED')}>
                      <span className="material-symbols-outlined">publish</span>
                      Xuất bản khóa học
                    </button>
                  )}

                  {/* PUBLISHED -> Hide button */}
                  {course.status === 'PUBLISHED' && (
                    <button className="btn btn-secondary sidebar-btn" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleUpdateCourseStatus('HIDDEN')}>
                      <span className="material-symbols-outlined">visibility_off</span>
                      Ẩn khóa học
                    </button>
                  )}

                  {/* HIDDEN -> Show again button */}
                  {course.status === 'HIDDEN' && (
                    <button className="btn btn-conversion sidebar-btn" onClick={() => handleUpdateCourseStatus('PUBLISHED')}>
                      <span className="material-symbols-outlined">visibility</span>
                      Hiển thị lại khóa học
                    </button>
                  )}

                  <button className="btn btn-primary sidebar-btn" onClick={() => setShowCourseModal(true)}>
                    <span className="material-symbols-outlined">edit_note</span>
                    Sửa thông tin khóa học
                  </button>

                  <button className="btn btn-secondary sidebar-btn" onClick={openCreateChapterModal}>
                    <span className="material-symbols-outlined">add</span>
                    Thêm chương mới
                  </button>

                  <button className="btn btn-secondary sidebar-btn" style={{ color: 'var(--error)', borderColor: 'var(--outline-variant)' }} onClick={handleDeleteCourse}>
                    <span className="material-symbols-outlined">delete</span>
                    Xóa khóa học
                  </button>

                  <Link to="/instructor/courses" className="btn btn-secondary sidebar-btn" style={{ marginTop: '8px' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Quay lại danh sách
                  </Link>
                </div>
              </div>
            </div>
          </aside>

        </div>
      )}

      {/* ── COURSE EDIT DETAILS MODAL ── */}
      <CourseEditModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSubmit={handleSubmitCourseDetails}
        categories={categories}
        initialData={course}
        submitting={courseSubmitting}
      />

      {/* ── CHAPTER ADD / EDIT MODAL ── */}
      <ChapterModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        onSubmit={handleSubmitChapter}
        editingChapter={editingChapter}
        submitting={chapterSubmitting}
      />

      {/* ── LESSON ADD / EDIT MODAL ── */}
      <LessonModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSubmit={handleSubmitLesson}
        editingLesson={editingLesson}
        submitting={lessonSubmitting}
        getMuxBadgeText={getMuxBadgeText}
      />
    </div>
  );
}
