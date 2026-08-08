import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/HomePage.css';

const HERO_IMG = 'https://media-cdn-v2.laodong.vn/storage/newsportal/2020/3/7/789153/HOC-TRUC-TUYEN.jpg?w=800&h=496&crop=auto&scale=both';

const COURSE_IMGS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD3lx1weGMshI61Ni42W9pzWZTioGEfpc-SjjEQ5ddAiJ-hKPozJTmbgjjVT5Wa2WfFkyAKpoey8dGOb0wPEhDP4W-v4HUqBbHX1iHwhy18LAMO3W-H2u7SMULWGnwUlnKOKhA5-PcA8C_DPvoA1JiPc_fMXE1boEMq3fJOgrv7jtsnJSuk_UDubFippl_k1Bw4ffDdldN9rPD2ISkAYR0dknNImcTuVkG1yu-N2sG0biVcFuI7y0XSOijDYgsMviUsUU6_DD84Anc',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA37WX5pMYDaUi0ZayDHmA2n-xjhvOd61CDO8kgFV5cO0BGx6RNzrSdJuDpHHBUok6AtQnQd1tqdvS4eFj6E1vf_HaXdvkVSMsYpZ-scdWLxEjBVFAqMHJHKeoL4DRrsSERhSePpe_d1kqIvRM_PzRcNFxFhg3w9KHioOitXDhE-kXmSCGacsP_Q8NGsu2VkWAsvlC1KLWeKcpwYUE-hMkz3OzkVBlsHjncwX_bNuKIeO6nE3iy58EE6uFYdB7sSHVnXuY-rfGm3_I',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB1PABUgiLdd8jitcoPzumwQlzkwD6m808yomBN3HYkaCSvapDmIIyYZaF1XaXfpVhzdCIcd-JjfxYbCsX6kdkZA3WvdgLVr0IOzsu7ikT2dia4sk55jwNsJH_imuAUnviQKDUTqBxvc2XOk0cCxv7x3RLAG_HlSv3u0cM9dDGUQndNnmk7xj8PG9Upd2gOf8CVeESea0d-KOqQPT1vZkTZob1bZwbH9pDx_hFhW-z9vd28uU9j9zjz1R6Bd4x6P4Y_QUXNhmMT6R4',
];

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';


export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [courseGroups, setCourseGroups] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Carousel states
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [catStart, setCatStart] = useState(0);
  const [roadmapStart, setRoadmapStart] = useState(0);
  const [courseStart, setCourseStart] = useState(0);

  // Calculate page sizes dynamically based on screen width
  let catPageSize = 4;
  if (windowWidth <= 500) catPageSize = 1;
  else if (windowWidth <= 900) catPageSize = 2;

  let roadmapPageSize = 2;
  if (windowWidth <= 768) roadmapPageSize = 1;

  let coursePageSize = 3;
  if (windowWidth <= 600) coursePageSize = 1;
  else if (windowWidth <= 900) coursePageSize = 2;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    if (categories.length > 0) {
      setCatStart(prev => Math.min(prev, Math.max(0, categories.length - catPageSize)));
    }
  }, [catPageSize, categories.length]);

  useEffect(() => {
    if (courseGroups.length > 0) {
      setRoadmapStart(prev => Math.min(prev, Math.max(0, courseGroups.length - roadmapPageSize)));
    }
  }, [roadmapPageSize, courseGroups.length]);

  useEffect(() => {
    if (recommendedCourses.length > 0) {
      setCourseStart(prev => Math.min(prev, Math.max(0, recommendedCourses.length - coursePageSize)));
    }
  }, [coursePageSize, recommendedCourses.length]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const catRes = await fetch(API_BASE + '/api/categories');
        const catJson = await catRes.json();
        if (catRes.ok && catJson.data) {
          const rootCategories = catJson.data.filter((item) => !item.parent_id);
          const mappedCategories = rootCategories.map((item) => ({
            id: item.id,
            title: item.name,
            description: item.description || ''
          }));
          setCategories(mappedCategories);
        }

        // Fetch recommended courses
        const recRes = await fetch(API_BASE + '/api/recomended-courses');
        const recJson = await recRes.json();
        if (recRes.ok && recJson.data) {
          setRecommendedCourses(recJson.data);
        }

        // Fetch course groups
        const groupRes = await fetch(API_BASE + '/api/course-groups');
        const groupJson = await groupRes.json();
        if (groupRes.ok && groupJson.data) {
          setCourseGroups(groupJson.data);
        }

        // Fetch enrolled courses if user is logged in
        const token = localStorage.getItem('access_token');
        if (token) {
          const enrollRes = await fetch(API_BASE + '/api/student/my-courses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const enrollJson = await enrollRes.json();
          if (enrollRes.ok && enrollJson.data) {
            setEnrolledCourseIds(enrollJson.data.map(c => c.id));
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ Backend:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const getCourseImage = (course, index) => {
    if (!course.thumbnail_url) return COURSE_IMGS[index % COURSE_IMGS.length];
    return course.thumbnail_url.startsWith('http') ? course.thumbnail_url : `${API_BASE}${course.thumbnail_url}`;
  };

  const handleEnrollOrOrder = async (course) => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'STUDENT') {
      setShowLoginModal(true);
      return;
    }

    const price = parseFloat(course.price || 0);

    if (price === 0) {
      setEnrollingCourseId(course.id);
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
          setEnrolledCourseIds(prev => [...prev, course.id]);
          navigate(`/courses/${course.id}`);
        } else {
          alert(data.message || 'Đăng ký thất bại.');
        }
      } catch (err) {
        console.error('Error during free enroll:', err);
        alert('Lỗi kết nối. Không thể đăng ký.');
      } finally {
        setEnrollingCourseId(null);
      }
    } else {
      navigate(`/order/${course.id}`);
    }
  };

  return (
    <div className="landing-page">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main>
        {/* ──────── Hero Section ──────── */}
        <section className="hero-section">
          <div className="hero-inner container-max">
            <div className="hero-content animate-fade-in-up">
              <h1 className="font-display-lg hero-title">
                Làm chủ tương lai với{' '}
                <span className="hero-highlight">lộ trình học tập được định hướng</span>
              </h1>
              <p className="font-body-lg hero-subtitle">
                Mở khóa tiềm năng với lộ trình học hiện đại, từ kiến thức nền tảng đến kỹ năng nâng cao.
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">10K+</span>
                  <span className="stat-label font-body-sm">Học viên</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">500+</span>
                  <span className="stat-label font-body-sm">Khóa học</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">98%</span>
                  <span className="stat-label font-body-sm">Hài lòng</span>
                </div>
              </div>
            </div>
            <div className="hero-visual animate-slide-in-right delay-200">
              <div className="hero-image-wrapper">
                <img src={HERO_IMG} alt="Learner studying online" className="hero-image" />
              </div>
            </div>
          </div>
          {/* Decorative blobs */}
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </section>

        {/* ──────── Categories Section ──────── */}
        <section className="categories-section" id="categories">
          <div className="container-max">
            <div className="courses-header">
              <h2 className="font-headline-lg section-title">Danh mục</h2>
              <Link to="/courses" className="btn-ghost" style={{ textDecoration: 'none' }}>Xem tất cả →</Link>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                Đang tải danh mục...
              </div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                Không có danh mục nào.
              </div>
            ) : (
              <div className="carousel-wrapper">
                <button
                  className="carousel-arrow-btn prev"
                  disabled={catStart === 0}
                  onClick={() => setCatStart(prev => Math.max(0, prev - catPageSize))}
                  aria-label="Previous categories"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div className="categories-grid">
                  {categories.slice(catStart, catStart + catPageSize).map((cat, i) => (
                    <Link key={cat.id} to={`/courses?category=${cat.id}`} className={`category-card card animate-fade-in-up delay-${(i + 1) * 100}`} style={{ textDecoration: 'none' }}>
                      <h3 className="font-headline-sm">{cat.title}</h3>
                      <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{cat.description}</p>
                      <span className="category-arrow material-symbols-outlined">arrow_forward</span>
                    </Link>
                  ))}
                </div>

                <button
                  className="carousel-arrow-btn next"
                  disabled={catStart >= categories.length - catPageSize}
                  onClick={() => setCatStart(prev => Math.min(prev + catPageSize, categories.length - catPageSize))}
                  aria-label="Next categories"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ──────── Roadmaps Section ──────── */}
        <section className="roadmaps-section" id="roadmaps">
          <div className="container-max">
            <div className="courses-header">
              <h2 className="font-headline-lg">Lộ trình học</h2>
              <Link to="/roadmaps" className="btn-ghost" style={{ textDecoration: 'none' }}>Xem tất cả →</Link>
            </div>
            <div className="carousel-wrapper">
              {courseGroups.length > roadmapPageSize && (
                <button
                  className="carousel-arrow-btn prev"
                  disabled={roadmapStart === 0}
                  onClick={() => setRoadmapStart(prev => Math.max(0, prev - roadmapPageSize))}
                  aria-label="Previous roadmaps"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              )}

              <div className="roadmaps-grid">
                {loading ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                    Đang tải lộ trình học...
                  </div>
                ) : courseGroups.length > 0 ? (
                  courseGroups.slice(roadmapStart, roadmapStart + roadmapPageSize).map((group, index) => (
                    <div key={group.id} className="roadmap-card card">
                      <h3 className="font-headline-md roadmap-title">{group.title}</h3>
                      {group.description && (
                        <p className="font-body-sm text-muted" style={{ margin: '-8px 0 16px 0', color: 'var(--on-surface-variant)' }}>
                          {group.description}
                        </p>
                      )}
                      <ul className="roadmap-steps">
                        {group.course_group_items?.map((item, i) => (
                          <li key={item.course_id} className="roadmap-step">
                            <span className={`step-number step-primary`}>
                              {i + 1}
                            </span>
                            <span className="font-body-md" style={{ fontWeight: 600 }}>
                              {item.courses?.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link to={`/roadmaps/${group.id}`} className="btn btn-secondary roadmap-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        Xem lộ trình
                      </Link>
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                    Không có lộ trình học nào.
                  </div>
                )}
              </div>

              {courseGroups.length > roadmapPageSize && (
                <button
                  className="carousel-arrow-btn next"
                  disabled={roadmapStart >= courseGroups.length - roadmapPageSize}
                  onClick={() => setRoadmapStart(prev => Math.min(prev + roadmapPageSize, courseGroups.length - roadmapPageSize))}
                  aria-label="Next roadmaps"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ──────── Courses Section ──────── */}
        <section className="courses-section" id="courses">
          <div className="container-max">
            <div className="courses-header">
              <h2 className="font-headline-lg">Khóa học đề xuất</h2>
              <Link to="/courses" className="btn-ghost" style={{ textDecoration: 'none' }}>Xem tất cả →</Link>
            </div>
            <div className="carousel-wrapper">
              {recommendedCourses.length > coursePageSize && (
                <button
                  className="carousel-arrow-btn prev"
                  disabled={courseStart === 0}
                  onClick={() => setCourseStart(prev => Math.max(0, prev - coursePageSize))}
                  aria-label="Previous courses"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              )}

              <div className="courses-grid">
                {loading ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                    Đang tải danh sách khóa học...
                  </div>
                ) : recommendedCourses.length > 0 ? (
                  recommendedCourses.slice(courseStart, courseStart + coursePageSize).map((course, i) => (
                    <Link key={course.id} to={`/courses/${course.id}`} className={`course-card card animate-fade-in-up delay-${(i + 1) * 100}`}>
                      <div className="course-image-wrapper">
                        <img src={getCourseImage(course, i)} alt={course.title} className="course-image" />
                      </div>
                      <div className="course-content">
                        <h3 className="font-headline-sm course-title">{course.title}</h3>
                        <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                          By {course.users?.full_name || 'Expert Instructor'}
                        </p>
                        <div className="course-footer">
                          {!enrolledCourseIds.includes(course.id) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {parseFloat(course.price || 0) === 0 ? (
                                <span className="font-price-lg" style={{ color: '#035c04ff', fontWeight: 700 }}>
                                  Miễn phí
                                </span>
                              ) : course.discount_percentage && course.discount_percentage > 0 ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="font-price-lg" style={{ color: '#035c04ff', fontWeight: 700 }}>
                                      {parseFloat(course.discounted_price).toLocaleString('vi-VN')} đ
                                    </span>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: 'white',
                                      backgroundColor: 'var(--error, #ba1a1a)',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}>
                                      -{course.discount_percentage}%
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '13px', color: 'var(--outline)', textDecoration: 'line-through' }}>
                                    {parseFloat(course.price).toLocaleString('vi-VN')} đ
                                  </span>
                                </>
                              ) : (
                                <span className="font-price-lg" style={{ color: 'var(--primary)' }}>
                                  {parseFloat(course.price).toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={enrollingCourseId === course.id}
                            onClick={(e) => {
                              if (!enrolledCourseIds.includes(course.id)) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEnrollOrOrder(course);
                              }
                            }}
                          >
                            {enrolledCourseIds.includes(course.id)
                              ? 'Đã đăng ký'
                              : (enrollingCourseId === course.id ? 'Đang đăng ký...' : 'Đăng ký ngay')}
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                    Chưa có khóa học được đề xuất nào
                  </div>
                )}
              </div>

              {recommendedCourses.length > coursePageSize && (
                <button
                  className="carousel-arrow-btn next"
                  disabled={courseStart >= recommendedCourses.length - coursePageSize}
                  onClick={() => setCourseStart(prev => Math.min(prev + coursePageSize, recommendedCourses.length - coursePageSize))}
                  aria-label="Next courses"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <span className="material-symbols-outlined modal-icon">lock</span>
            </div>
            <h3 className="modal-title">Yêu cầu đăng nhập</h3>
            <p className="modal-message">Bạn phải đăng nhập mới được đăng ký</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowLoginModal(false)}>
                Đóng
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login');
                }}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
