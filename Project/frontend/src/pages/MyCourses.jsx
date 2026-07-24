import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
const DEFAULT_COURSE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setCourses([]);
      setLoading(false);
      return;
    }

    const fetchMyCourses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/student/my-courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          localStorage.clear();
          setCourses([]);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (res.ok && json.data) {
          setCourses(json.data);
        }
      } catch (err) {
        console.error("Error fetching my courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [navigate]);

  const getCourseImage = (c) => {
    if (!c.thumbnail_url) return DEFAULT_COURSE_IMG;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flexGrow: 1, padding: '96px 24px 40px', backgroundColor: 'var(--background)'}}>
        <div className="container-max" style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 className="font-headline-lg" style={{ color: 'var(--on-background)', fontWeight: 800 }}>Khóa học của bạn</h1>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Quản lý và tiếp tục hành trình học tập của bạn tại EduPro.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}>sync</span>
              <span className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>Đang tải danh sách khóa học...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '40px auto',
              boxShadow: 'var(--shadow-card)',
              borderRadius: 'var(--borderRadius-xl)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--primary)', opacity: 0.6 }}>school</span>
              <h3 className="font-headline-sm" style={{ marginTop: '24px', color: 'var(--on-background)' }}>Chưa có khóa học nào</h3>
              <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
                Bạn chưa đăng ký khóa học nào. Hãy khám phá thư viện khóa học của chúng tôi để bắt đầu hành trình học tập của bạn ngay hôm nay!
              </p>
              <Link to="/courses" className="btn btn-primary" style={{ padding: '12px 32px', fontWeight: 600 }}>
                Khám phá ngay
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--gutter)',
              marginTop: '16px'
            }}>
              {courses.map((course, i) => (
                <div key={course.id} className="card hover-scale" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--borderRadius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                  backgroundColor: 'var(--surface-container-lowest)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid var(--outline-variant)'
                }}>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
                    <img
                      src={getCourseImage(course)}
                      alt={course.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {course.categories && (
                      <span className="tag tag-category" style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: 'var(--borderRadius)',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {course.categories.name}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 className="font-headline-sm" style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--on-background)',
                      lineHeight: '1.4',
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '50px'
                    }}>
                      {course.title}
                    </h3>
                    <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
                      Giảng viên: <strong style={{ color: 'var(--on-background)' }}>{course.users?.full_name || 'Expert Instructor'}</strong>
                    </p>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                      <Link to={`/courses/${course.id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: '10px' }}>
                        Chi tiết
                      </Link>
                      <button
                        onClick={async () => {
                          // Find first lesson for routing
                          try {
                            const res = await fetch(`${API_BASE}/api/course/${course.id}`);
                            const json = await res.json();
                            if (res.ok && json.data) {
                              const sections = json.data.course_sections || [];
                              const firstSection = sections.find(s => s.order_index === 0) || sections[0];
                              const firstLesson = firstSection?.lessons?.find(l => l.order_index === 0) || firstSection?.lessons?.[0];
                              if (firstLesson) {
                                navigate(`/courses/${course.id}/lessons/${firstLesson.id}`);
                              } else {
                                alert('Khóa học này hiện chưa có bài học nào.');
                              }
                            }
                          } catch (err) {
                            console.error("Error navigating to first lesson:", err);
                          }
                        }}
                        className="btn btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', padding: '10px' }} >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>Vào học ngay</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
