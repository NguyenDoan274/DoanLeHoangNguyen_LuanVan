import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/RoadmapDetail.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function RoadmapDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const defaultCourseImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

  useEffect(() => {
    const fetchRoadmapData = async () => {
      setLoading(true);
      try {
        // Fetch course group details
        const groupRes = await fetch(`${API_BASE}/api/course-group/${groupId}`);
        const groupJson = await groupRes.json();
        if (groupRes.ok && groupJson.data) {
          setGroup(groupJson.data);
        } else {
          setError('Không tìm thấy lộ trình học.');
        }

        // Fetch enrolled courses if logged in
        const token = localStorage.getItem('access_token');
        if (token) {
          const enrollRes = await fetch(`${API_BASE}/api/student/my-courses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const enrollJson = await enrollRes.json();
          if (enrollRes.ok && enrollJson.data) {
            setEnrolledCourseIds(enrollJson.data.map(c => c.id));
          }
        }
      } catch (err) {
        console.error('Error fetching roadmap details:', err);
        setError('Lỗi kết nối mạng, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmapData();
  }, [groupId]);

  const handleEnrollRoadmap = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!group) return;

    // Determine remaining courses to purchase
    const groupItems = group.course_group_items || [];
    const remainingCourses = groupItems
      .map(item => item.courses)
      .filter(course => course && !enrolledCourseIds.includes(course.id));

    if (remainingCourses.length === 0) {
      alert('Bạn đã đăng ký toàn bộ khóa học trong lộ trình này rồi.');
      return;
    }

    // Calculate total price of remaining courses
    const totalPrice = remainingCourses.reduce((sum, course) => sum + parseFloat(course.price || 0), 0);

    if (totalPrice === 0) {
      setEnrolling(true);
      try {
        const res = await fetch(`${API_BASE}/api/order/free-enroll-group`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ course_group_id: group.id })
        });
        
        const data = await res.json();
        if (res.ok) {
          alert('Đăng ký lộ trình học thành công!');
          navigate('/my-courses');
        } else {
          alert(data.message || 'Đăng ký lộ trình thất bại.');
        }
      } catch (err) {
        console.error('Error free enrolling roadmap:', err);
        alert('Lỗi kết nối mạng.');
      } finally {
        setEnrolling(false);
      }
    } else {
      // Redirect to Order check page for roadmap group payment
      navigate(`/order/${group.id}?type=group`);
    }
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
            <span>Đang tải thông tin lộ trình...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--error)' }}>error</span>
            <h3>Đã xảy ra lỗi</h3>
            <p>{error || 'Không tìm thấy lộ trình.'}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Quay lại trang chủ</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const groupItems = group.course_group_items || [];
  const totalCoursesCount = groupItems.length;
  
  // Remaining courses filter
  const remainingCourses = groupItems
    .map(item => item.courses)
    .filter(course => course && !enrolledCourseIds.includes(course.id));

  const enrolledCount = totalCoursesCount - remainingCourses.length;
  const totalPrice = remainingCourses.reduce((sum, course) => sum + parseFloat(course.price || 0), 0);

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flexGrow: 1, paddingBottom: '60px' }}>
        <div className="roadmap-detail-container">
          {/* Breadcrumbs */}
          <nav className="roadmap-breadcrumbs">
            <Link to="/">Trang chủ</Link>
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="current">Chi tiết lộ trình</span>
          </nav>

          {/* Hero Section */}
          <section className="roadmap-hero">
            <h1 className="roadmap-hero-title">{group.title}</h1>
            <p className="roadmap-hero-desc">
              {group.description || 'Lộ trình học tập chuyên nghiệp được thiết kế tối ưu giúp bạn đạt mục tiêu nhanh chóng.'}
            </p>
          </section>

          {/* Main Layout Grid */}
          <div className="roadmap-layout">
            
            {/* Left: Courses list */}
            <section className="roadmap-courses-section">
              <h2 className="roadmap-section-title">Danh sách khóa học ({totalCoursesCount})</h2>
              
              <div className="roadmap-courses-list">
                {groupItems.map((item, idx) => {
                  const course = item.courses;
                  if (!course) return null;
                  const isEnrolled = enrolledCourseIds.includes(course.id);
                  const courseImage = course.thumbnail_url
                    ? (course.thumbnail_url.startsWith('http') ? course.thumbnail_url : `${API_BASE}${course.thumbnail_url}`)
                    : defaultCourseImage;

                  return (
                    <div key={item.id} className="roadmap-course-card">
                      <img src={courseImage} alt={course.title} className="roadmap-course-img" />
                      <div className="roadmap-course-info">
                        <div>
                          <h3 className="roadmap-course-title">
                            {idx + 1}. {course.title}
                          </h3>
                          <p className="roadmap-course-instructor">
                            Giảng viên: {course.users?.full_name || 'Expert Instructor'}
                          </p>
                        </div>
                        
                        <div className="roadmap-course-footer">
                          <span className="roadmap-course-price">
                            {parseFloat(course.price) > 0 ? `${parseFloat(course.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                          </span>
                          
                          <span className={`roadmap-status-badge ${isEnrolled ? 'status-enrolled' : 'status-not-enrolled'}`}>
                            {isEnrolled ? 'Đã đăng ký' : 'Chưa đăng ký'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Right: Sticky Sidebar */}
            <aside>
              <div className="roadmap-sidebar">
                <h3 className="roadmap-sidebar-title">Đăng ký lộ trình</h3>
                
                <div className="roadmap-summary-list">
                  <div className="roadmap-summary-item">
                    <span>Tổng số khóa học:</span>
                    <span style={{ fontWeight: 600 }}>{totalCoursesCount}</span>
                  </div>
                  <div className="roadmap-summary-item">
                    <span>Khóa học đã đăng ký:</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{enrolledCount}</span>
                  </div>
                  <div className="roadmap-summary-item">
                    <span>Khóa học cần mua thêm:</span>
                    <span style={{ fontWeight: 600 }}>{remainingCourses.length}</span>
                  </div>
                  
                  <div className="roadmap-summary-total">
                    <span>Tổng tiền thanh toán:</span>
                    <span style={{ color: 'var(--error)', fontSize: '20px', fontWeight: 800 }}>
                      {totalPrice > 0 ? `${totalPrice.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: '48px', fontWeight: 700 }}
                  onClick={handleEnrollRoadmap}
                  disabled={enrolling || remainingCourses.length === 0}
                >
                  {enrolling ? 'Đang xử lý...' : remainingCourses.length === 0 ? 'Đã sở hữu lộ trình' : 'Đăng Ký Lộ Trình'}
                </button>
              </div>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
