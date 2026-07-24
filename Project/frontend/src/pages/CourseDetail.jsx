import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/CourseDetail.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const defaultCourseImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';
  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/course/${courseId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setCourse(json.data);
          // Initialize first section as open by default
          if (json.data.course_sections && json.data.course_sections.length > 0) {
            setOpenSections({ [json.data.course_sections[0].id]: true });
          }
        }

        // Fetch enrolled courses to check status
        const token = localStorage.getItem('access_token');
        if (token) {
          const myCoursesRes = await fetch(`${API_BASE}/api/student/my-courses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (myCoursesRes.ok) {
            const myCoursesJson = await myCoursesRes.json();
            if (myCoursesJson.data) {
              setEnrolled(myCoursesJson.data.some(c => c.id === courseId));
            }
          }
        }
      } catch (e) {
        console.error("Error fetching course detail:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="loading-container">
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
            <span>Đang tải thông tin khóa học...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="error-container" style={{ textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--error)' }}>error</span>
            <h3>Không tìm thấy khóa học</h3>
            <p>Khóa học này không tồn tại hoặc đã bị ẩn.</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Quay lại danh sách</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const courseImage = course.thumbnail_url
    ? (course.thumbnail_url.startsWith('http') ? course.thumbnail_url : `${API_BASE}${course.thumbnail_url}`)
    : defaultCourseImage;

  const instructorAvatar = course.users?.avatar_url
    ? (course.users.avatar_url.startsWith('http') ? course.users.avatar_url : `${API_BASE}${course.users.avatar_url}`)
    : defaultAvatar;

  // Format level text
  const levelText = course.level === 'BEGINNER' ? 'Mới bắt đầu'
    : course.level === 'INTERMEDIATE' ? 'Trung cấp'
      : 'Nâng cao';

  // Format price
  const price = parseFloat(course.price || 0);
  const isFree = price === 0;
  const originalPrice = price * 1.8;

  // Calculate total lessons and total duration
  const sections = course.course_sections || [];
  const totalLessons = sections.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0);
  const totalDurationSec = sections.reduce((acc, sec) => {
    return acc + (sec.lessons?.reduce((lAcc, les) => lAcc + (les.duration_sec || 0), 0) || 0);
  }, 0);

  const formatDuration = (sec) => {
    if (sec <= 0) return '0 phút';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.round((sec % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} giờ ${mins > 0 ? `${mins} phút` : ''}`;
    }
    return `${mins} phút`;
  };

  const formatSectionDuration = (lessons = []) => {
    const sec = lessons.reduce((acc, les) => acc + (les.duration_sec || 0), 0);
    return formatDuration(sec);
  };

  const handleEnrollOrOrder = async () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'STUDENT') {
      navigate('/login');
      return;
    }

    const price = parseFloat(course.price || 0);

    if (price === 0) {
      setEnrolling(true);
      try {
        const res = await fetch(`${API_BASE}/api/order/free-enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ course_id: course.id })
        });

        const data = await res.json();
        if (res.ok) {
          alert('Đăng ký khóa học thành công!');
          navigate('/profile');
        } else {
          alert(data.message || 'Đăng ký thất bại.');
        }
      } catch (err) {
        console.error('Error during free enroll:', err);
        alert('Lỗi kết nối. Không thể đăng ký.');
      } finally {
        setEnrolling(false);
      }
    } else {
      navigate(`/order/${course.id}`);
    }
  };

  const handleGoToFirstLesson = () => {
    if (!course || !course.course_sections) return;
    const sections = course.course_sections || [];
    const section0 = sections.find(s => s.order_index === 0) || sections[0];
    const lesson0 = section0?.lessons?.find(l => l.order_index === 0) || section0?.lessons?.[0];
    if (lesson0) {
      navigate(`/courses/${courseId}/lessons/${lesson0.id}`);
    } else {
      alert('Khóa học này hiện chưa có bài học nào.');
    }
  };

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flexGrow: 1, paddingBottom: 'var(--section-gap)' }} className="course-detail-main">
        <div className="detail-container">
          {/* Breadcrumbs */}
          <nav className="detail-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="material-symbols-outlined">chevron_right</span>
            <Link to="/courses">Courses</Link>
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="current">{course.title}</span>
          </nav>

          <div className="detail-layout animate-fade-in">
            {/* Left Column (65%) */}
            <div className="detail-content-left">
              {/* Hero Header */}
              <section className="detail-hero-section">
                <div className="detail-tags">
                  <span className="tag tag-category">{course.categories?.name || 'Chưa phân loại'}</span>
                  <span className="tag tag-level">{levelText}</span>
                </div>
                <h1 className="detail-title">{course.title}</h1>
                <p className="detail-subtitle">{course.short_description || 'Tìm hiểu các kỹ năng chuyên nghiệp từ chuyên gia hàng đầu.'}</p>

                <div className="detail-instructor-summary">
                  <img className="instructor-avatar" src={instructorAvatar} alt={course.users?.full_name} />
                  <div>
                    <span className="instructor-label">Giảng viên</span>
                    <h4 className="instructor-name">{course.users?.full_name || 'Expert Instructor'}</h4>
                  </div>
                </div>
              </section>

              {/* What you'll learn */}
              <section className="detail-learn-section card">
                <h3 className="section-title">Bạn sẽ học được gì?</h3>
                <ul className="learn-benefits">
                  <li>
                    <span className="material-symbols-outlined check-icon">check_circle</span>
                    <span>Tiếp cận nội dung khóa học được trình bày rõ ràng và có hệ thống.</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined check-icon">check_circle</span>
                    <span>Học tập linh hoạt theo thời gian và tốc độ phù hợp với bản thân.</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined check-icon">check_circle</span>
                    <span>Dễ dàng xem lại các bài giảng để củng cố kiến thức khi cần thiết.</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined check-icon">check_circle</span>
                    <span>Mở rộng hiểu biết và nâng cao kiến thức trong lĩnh vực bạn quan tâm.</span>
                  </li>
                </ul>

              </section>

              {/* Curriculum Section */}
              <section className="detail-curriculum-section">
                <div className="curriculum-header">
                  <h2 className="section-title-lg">Nội dung khóa học</h2>
                  <span className="curriculum-stats">
                    {sections.length} chương • {totalLessons} bài học • {formatDuration(totalDurationSec)}
                  </span>
                </div>

                <div className="curriculum-accordion">
                  {sections.length === 0 ? (
                    <div className="empty-curriculum">Khóa học hiện chưa có bài học nào.</div>
                  ) : (
                    sections.map((section, idx) => {
                      const isOpen = !!openSections[section.id];
                      return (
                        <div key={section.id} className={`accordion-item ${isOpen ? 'active' : ''}`}>
                          <button className="accordion-toggle" onClick={() => toggleSection(section.id)}>
                            <div className="accordion-title-left">
                              <span className="material-symbols-outlined toggle-arrow">expand_more</span>
                              <span className="accordion-title-text">
                                Chương {idx + 1}: {section.title}
                              </span>
                            </div>
                            <span className="accordion-stats-right">
                              {section.lessons?.length || 0} bài học • {formatSectionDuration(section.lessons)}
                            </span>
                          </button>

                          <div className="accordion-content-wrapper">
                            <ul className="lesson-list">
                              {section.lessons?.map((lesson) => {
                                const isUnlocked = enrolled || lesson.is_preview;
                                return isUnlocked ? (
                                  <li key={lesson.id} className="lesson-item" style={{ cursor: 'pointer' }}>
                                    <Link to={`/courses/${courseId}/lessons/${lesson.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textDecoration: 'none', color: 'inherit' }}>
                                      <div className="lesson-left">
                                        <span className="material-symbols-outlined lesson-icon" style={{ color: 'var(--primary)' }}>play_circle</span>
                                        <span className="lesson-name">{lesson.title}</span>
                                      </div>
                                      <div className="lesson-right">
                                        {lesson.is_preview && <span className="preview-tag">Xem thử</span>}
                                      </div>
                                    </Link>
                                  </li>
                                ) : (
                                  <li key={lesson.id} className="lesson-item" style={{ opacity: 0.6 }}>
                                    <div className="lesson-left">
                                      <span className="material-symbols-outlined lesson-icon">play_circle</span>
                                      <span className="lesson-name">{lesson.title}</span>
                                    </div>
                                    <div className="lesson-right">
                                      <span className="material-symbols-outlined lock-icon">lock</span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Detailed Description */}
              <section className="detail-description-section">
                <h2 className="section-title-lg">Mô tả khóa học</h2>
                <div className="description-text">
                  {course.description ? (
                    <div dangerouslySetInnerHTML={{ __html: course.description.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p>Chưa có mô tả chi tiết cho khóa học này.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column - Sticky Sidebar (35%) */}
            <aside className="detail-sidebar-container">
              <div className="detail-sidebar card">
                {/* Thumbnail */}
                <div className="sidebar-thumbnail-wrapper">
                  <img src={courseImage} alt={course.title} className="sidebar-thumbnail" />
                </div>

                {/* Info & Price */}
                {!enrolled && (
                  <div className="sidebar-price-info">
                    <div className="price-container">
                      {course.discount_percentage && course.discount_percentage > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="price-current" style={{ color: '#035c04ff' }}>
                              {parseFloat(course.discounted_price).toLocaleString('vi-VN')} đ
                            </span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 'white',
                              backgroundColor: 'var(--error, #ba1a1a)',
                              padding: '3px 8px',
                              borderRadius: '4px'
                            }}>
                              -{course.discount_percentage}%
                            </span>
                          </div>
                          <span style={{ fontSize: '15px', color: 'var(--outline)', textDecoration: 'line-through', marginTop: '2px' }}>
                            {price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ) : (
                        <span className="price-current">
                          {isFree ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Call to Actions */}
                <div className="sidebar-actions">
                  {enrolled ? (
                    <button
                      className="btn btn-primary w-full btn-checkout"
                      onClick={handleGoToFirstLesson}
                    >
                      Vào học ngay
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary w-full btn-checkout"
                        onClick={handleEnrollOrOrder}
                        disabled={enrolling}
                      >
                        {enrolling ? 'Đang đăng ký...' : 'Đăng Ký Ngay'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
