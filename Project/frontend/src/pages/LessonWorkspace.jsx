import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import '../css/LessonWorkspace.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
export default function LessonWorkspace() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch course details
        const courseRes = await fetch(`${API_BASE}/api/course/${courseId}`);
        const courseJson = await courseRes.json();
        let fetchedCourse = null;
        if (courseRes.ok && courseJson.data) {
          fetchedCourse = courseJson.data;
          setCourse(fetchedCourse);
        } else {
          navigate('/courses');
          return;
        }

        // Fetch enrollment status if logged in as STUDENT
        let userIsEnrolled = false;
        if (token && role === 'STUDENT') {
          const myCoursesRes = await fetch(`${API_BASE}/api/student/my-courses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (myCoursesRes.ok) {
            const myCoursesJson = await myCoursesRes.json();
            if (myCoursesJson.data) {
              userIsEnrolled = myCoursesJson.data.some(c => c.id === courseId);
            }
          }
        }
        setEnrolled(userIsEnrolled);

        // Find active lesson
        const sections = fetchedCourse.course_sections || [];
        let lessonToActivate = null;

        if (lessonId) {
          // Find lesson by lessonId
          for (const sec of sections) {
            const found = sec.lessons?.find(l => l.id === lessonId);
            if (found) {
              lessonToActivate = found;
              break;
            }
          }
        }

        // If no lessonId or lesson not found, fallback to order_index = 0 of section order_index = 0
        if (!lessonToActivate) {
          const section0 = sections.find(s => s.order_index === 0) || sections[0];
          const lesson0 = section0?.lessons?.find(l => l.order_index === 0) || section0?.lessons?.[0];
          lessonToActivate = lesson0;
        }

        // Access control check
        if (lessonToActivate) {
          const isUnlocked = userIsEnrolled || lessonToActivate.is_preview;
          if (!isUnlocked) {
            alert('Bài học này đã bị khóa. Vui lòng đăng ký khóa học để xem.');
            navigate(`/courses/${courseId}`);
            return;
          }
          setActiveLesson(lessonToActivate);
        } else {
          alert('Khóa học chưa có bài giảng nào.');
          navigate(`/courses/${courseId}`);
        }
      } catch (err) {
        console.error("Error loading workspace data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId, navigate]);

  const fetchCourseDetailsSilent = async () => {
    try {
      const courseRes = await fetch(`${API_BASE}/api/course/${courseId}`);
      const courseJson = await courseRes.json();
      if (courseRes.ok && courseJson.data) {
        const fetchedCourse = courseJson.data;
        setCourse(fetchedCourse);
        
        if (activeLesson && activeLesson.mux_status === 'PROCESSING') {
          const sections = fetchedCourse.course_sections || [];
          for (const sec of sections) {
            const found = sec.lessons?.find(l => l.id === activeLesson.id);
            if (found && found.mux_status === 'READY') {
              setActiveLesson(found);
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Silent error fetching course details:", err);
    }
  };

  useEffect(() => {
    let intervalId;
    const isProcessing = activeLesson?.mux_status === 'PROCESSING';

    if (isProcessing) {
      intervalId = setInterval(() => {
        fetchCourseDetailsSilent();
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeLesson, courseId]);

  const handleLessonClick = (lesson) => {
    const isUnlocked = enrolled || lesson.is_preview;
    if (!isUnlocked) {
      alert('Bài học này đã bị khóa. Vui lòng đăng ký khóa học để học tiếp.');
      return;
    }
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
            <span>Đang tải không gian học tập...</span>
          </div>
        </main>
      </div>
    );
  }

  const sections = course?.course_sections || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main className="lesson-workspace-container">
        {/* Left Side: Video & resources */}
        <section className="workspace-content-left">
          <div className="workspace-left-inner">
            {/* Video Player */}
            <div className="video-player-area">
              <div className="workspace-video-wrapper">
                {activeLesson?.mux_playback_id && activeLesson?.mux_status === 'READY' ? (
                  <video
                    key={activeLesson.id}
                    controls
                    autoPlay
                    poster={`https://image.mux.com/${activeLesson.mux_playback_id}/thumbnail.jpg?width=640`}
                    src={`https://stream.mux.com/${activeLesson.mux_playback_id}.m3u8`}
                  />
                ) : (
                  <div className="workspace-video-placeholder">
                    <span className="material-symbols-outlined">videocam_off</span>
                    <p className="font-body-md">
                      {activeLesson?.mux_status === 'PROCESSING' 
                        ? 'Video bài giảng đang được xử lý. Vui lòng thử lại sau.' 
                        : 'Bài học này chưa được tải video bài giảng.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="workspace-lesson-header">
                <div>
                  <h2 className="workspace-lesson-title">{activeLesson?.title}</h2>
                  <p className="workspace-lesson-subtitle">
                    {course?.title} • {activeLesson?.is_preview ? 'Bài học xem thử' : 'Nội dung chính thức'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="resource-tab-card">
              <div className="resource-tab-header">
                <span className="resource-tab-btn active" style={{ cursor: 'default' }}>
                  Mô tả bài giảng
                </span>
              </div>

              <div className="resource-tab-content">
                <div className="font-body-md" style={{ lineHeight: '1.7', color: 'var(--on-surface-variant)' }}>
                  {activeLesson?.content ? (
                    <p style={{ whiteSpace: 'pre-line' }}>{activeLesson.content}</p>
                  ) : (
                    <p>Không có mô tả chi tiết cho bài học này.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Right Side: Sidebar curriculum */}
        <aside className="workspace-sidebar-right">
          <div className="sidebar-progress-header">
            <h4 className="font-headline-sm" style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>Nội dung khóa học</h4>
            <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
              {enrolled ? 'Đã mở khóa toàn bộ khóa học' : 'Đang xem ở chế độ học thử'}
            </p>
          </div>

          <div className="sidebar-curriculum-list">
            {sections.map((section, sIdx) => (
              <div key={section.id} style={{ marginBottom: '16px' }}>
                <h5 className="workspace-section-title">
                  CHƯƠNG {sIdx + 1}: {section.title.toUpperCase()}
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {section.lessons?.map((lesson) => {
                    const isUnlocked = enrolled || lesson.is_preview;
                    const isActive = activeLesson?.id === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`workspace-lesson-row ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                      >
                        <span className={`material-symbols-outlined lesson-status-icon ${isActive ? 'active' : !isUnlocked ? 'locked' : 'unlocked'}`}>
                          {isActive ? 'play_circle' : !isUnlocked ? 'lock' : 'play_arrow'}
                        </span>
                        <div className="workspace-lesson-info">
                          <p className="workspace-lesson-name">{lesson.title}</p>
                          <p className="workspace-lesson-duration">
                            {lesson.duration_sec 
                              ? `${Math.round(lesson.duration_sec / 60)} phút`
                              : 'Video lý thuyết'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
