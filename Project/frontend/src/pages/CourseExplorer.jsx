import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/CourseExplorer.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function CourseExplorer() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';

  const setSearchQuery = (val) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (val) {
        newParams.set('q', val);
      } else {
        newParams.delete('q');
      }
      return newParams;
    });
  };

  const setSelectedCategory = (val) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (val && val !== 'All') {
        newParams.set('category', val);
      } else {
        newParams.delete('category');
      }
      return newParams;
    });
  };

  // Filters

  const [selectedLevels, setSelectedLevels] = useState({
    BEGINNER: false,
    INTERMEDIATE: false,
    ADVANCED: false
  });
  const [priceFilter, setPriceFilter] = useState('All'); // All, Free, Paid
  const [sortBy, setSortBy] = useState('Latest');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);

  const toggleExpandCategory = (catId, e) => {
    if (e) e.stopPropagation();
    setExpandedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const defaultCourseImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsheivi6ETPg3bv7gNdyuu_N1OEUmjaFk9ASWbnfWWKiJg9pj9UmXwEWoZvBkHbW6jQiV3DIAVc-AamxUdQtTgzfHQhHGqxJZH-E6br1CsEavmMNKQ4XTBwmKczcf1nExnwbiwIM_5ISbzR9ZZiC8fYvzQlODVBwArN65ogNVXuaZVsNkKa8RDwtEt97J0nbT__-arHKmE6m5__W5jAwIROOtwMbOC4cnqSCyzzpg3FbG9J0WFVLMtOdPQEyhFmSC6-rgzBYnGYV0';

  const levelLabels = {
    BEGINNER: 'Mới bắt đâu',
    INTERMEDIATE: 'Trung cấp',
    ADVANCED: 'Nâng cao',
  };
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLevels, priceFilter, sortBy]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch(`${API_BASE}/api/categories`);
      const catJson = await catRes.json();
      if (catRes.ok) {
        setCategories(catJson.data || []);
      }

      // Fetch published courses
      const courseRes = await fetch(`${API_BASE}/api/courses`);
      const courseJson = await courseRes.json();
      if (courseRes.ok) {
        setCourses(courseJson.data || []);
      }

      // Fetch enrolled courses if user is logged in
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
    } catch (e) {
      console.error("Error fetching explorer data:", e);
    } finally {
      setLoading(false);
    }
  }; const handleLevelChange = (level) => {
    setSelectedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getValidCategoryIds = (catId) => {
    if (catId === 'All') return [];
    const subCategoryIds = categories.filter(c => c.parent_id === catId).map(c => c.id);
    return [catId, ...subCategoryIds];
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    // Search query filter
    const matchesSearch = searchQuery
      ? course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Category filter (includes sub-categories if root category selected)
    const validCatIds = getValidCategoryIds(selectedCategory);
    const matchesCategory = selectedCategory === 'All'
      ? true
      : validCatIds.includes(course.category_id);

    // Level filter
    const activeLevels = Object.keys(selectedLevels).filter(k => selectedLevels[k]);
    const matchesLevel = activeLevels.length === 0
      ? true
      : activeLevels.includes(course.level);

    // Price filter
    const priceNum = parseFloat(course.price || 0);
    const matchesPrice = priceFilter === 'All'
      ? true
      : priceFilter === 'Free'
        ? priceNum === 0
        : priceNum > 0;

    return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'Price: Low to High') {
      return parseFloat(a.price || 0) - parseFloat(b.price || 0);
    }
    if (sortBy === 'Price: High to Low') {
      return parseFloat(b.price || 0) - parseFloat(a.price || 0);
    }
    // Default: Latest (created_at desc)
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const coursesPerPage = 12;
  const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = sortedCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  const getCourseImage = (c) => {
    if (!c.thumbnail_url) return defaultCourseImage;
    return c.thumbnail_url.startsWith('http') ? c.thumbnail_url : `${API_BASE}${c.thumbnail_url}`;
  };

  const getCategoryCount = (catId) => {
    if (catId === 'All') return courses.length;
    const validCatIds = getValidCategoryIds(catId);
    return courses.filter(c => validCatIds.includes(c.category_id)).length;
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

  // Get active category object for title & description
  const activeCategoryObj = categories.find(cat => cat.id === selectedCategory);
  const explorerTitle = selectedCategory === 'All' ? 'Khám phá khóa học' : (activeCategoryObj?.name || 'Category');
  const explorerDescription = selectedCategory === 'All'
    ? 'Khám phá các khóa học được thiết kế để giúp bạn phát triển kỹ năng và đạt được mục tiêu nghề nghiệp.'
    : (activeCategoryObj?.description || 'Học từ các chuyên gia hàng đầu.');

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main style={{ flexGrow: 1 }}>
        <div className="explorer-container">
          {/* Breadcrumbs */}
          <nav className="explorer-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            <span className="current">{explorerTitle}</span>
          </nav>

          <div className="explorer-layout animate-fade-in">
            {/* Sidebar Explorer */}
            <aside className="explorer-sidebar">
              {/* Categories section */}
              <div>
                <h3 className="filter-section-title">Danh mục</h3>
                <ul className="category-filter-list">
                  <li>
                    <div
                      className={`category-filter-item ${selectedCategory === 'All' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('All')}
                    >
                      <span>Tất cả</span>
                      <span className="category-count">{getCategoryCount('All')}</span>
                    </div>
                  </li>
                  {categories.filter(c => !c.parent_id).map(rootCat => {
                    const subCats = categories.filter(c => c.parent_id === rootCat.id);
                    const isExpanded = expandedCategoryIds.includes(rootCat.id) || selectedCategory === rootCat.id || subCats.some(sc => sc.id === selectedCategory);

                    return (
                      <li key={rootCat.id} style={{ marginBottom: 4 }}>
                        <div
                          className={`category-filter-item ${selectedCategory === rootCat.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(rootCat.id);
                            if (subCats.length > 0) {
                              setExpandedCategoryIds(prev =>
                                prev.includes(rootCat.id) ? prev : [...prev, rootCat.id]
                              );
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <span>{rootCat.name}</span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="category-count">{getCategoryCount(rootCat.id)}</span>
                            {subCats.length > 0 && (
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 18, color: 'var(--outline)', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={(e) => toggleExpandCategory(rootCat.id, e)}
                              >
                                {isExpanded ? 'expand_more' : 'chevron_right'}
                              </span>
                            )}
                          </div>
                        </div>

                        {subCats.length > 0 && isExpanded && (
                          <ul className="animate-fade-in" style={{ listStyle: 'none', paddingLeft: 14, margin: '2px 0 6px 0' }}>
                            {subCats.map(subCat => (
                              <li key={subCat.id}>
                                <div
                                  className={`category-filter-item ${selectedCategory === subCat.id ? 'active' : ''}`}
                                  onClick={() => setSelectedCategory(subCat.id)}
                                  style={{ fontSize: 13, padding: '4px 8px' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline)' }}></span>
                                    {subCat.name}
                                  </span>
                                  <span className="category-count">{getCategoryCount(subCat.id)}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Levels section */}
              <div>
                <h3 className="filter-section-title">Cấp độ</h3>

                <div className="checkbox-group">
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
                    <label
                      key={level}
                      className={`filter-label ${selectedLevels[level] ? 'active' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLevels[level]}
                        onChange={() => handleLevelChange(level)}
                      />

                      <span>{levelLabels[level]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price section */}
              <div>
                <h3 className="filter-section-title">Giá</h3>
                <div className="radio-group">
                  {['All', 'Free', 'Paid'].map((type) => (
                    <label key={type} className={`filter-label ${priceFilter === type ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="price"
                        checked={priceFilter === type}
                        onChange={() => setPriceFilter(type)}
                      />
                      <span>{type === 'All' ? 'Tất cả' : type === 'Free' ? 'Miễn phí' : 'Trả phí'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="explorer-main">
              {/* Header */}
              <div className="explorer-header">
                <h1 className="explorer-title">{explorerTitle}</h1>
                <p className="explorer-description">{explorerDescription}</p>
              </div>

              {/* Controls */}
              <div className="explorer-controls">
                <p className="results-count">
                  Hiển thị <strong>{sortedCourses.length}</strong> khóa học
                </p>
                <div className="sort-wrapper">
                  <span>Sắp xếp theo:</span>
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="Latest">Mới cập nhật</option>
                    <option value="Price: Low to High">Giá: Thấp đến Cao</option>
                    <option value="Price: High to Low">Giá: Cao đến Thấp</option>
                  </select>
                </div>
              </div>

              {/* Course Grid */}
              {loading ? (
                <div className="ic-loading" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>sync</span>
                  <span>Đang tải danh sách khóa học...</span>
                </div>
              ) : sortedCourses.length === 0 ? (
                <div className="ic-empty card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>library_books</span>
                  <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy khóa học nào</h3>
                  <p className="font-body-sm text-muted">Không có khóa học nào khớp với bộ lọc hiện tại. Thử đặt lại các tùy chọn.</p>
                </div>
              ) : (
                <>
                  <div className="explorer-grid">
                    {currentCourses.map((course) => (
                      <Link key={course.id} to={`/courses/${course.id}`} className="explorer-card">
                        <div className="card-image-wrapper">
                          <div className="level-tag">
                            {course.level === 'ADVANCED' ? 'Nâng cao' : course.level === 'INTERMEDIATE' ? 'Trung cấp' : 'Mới bắt đầu' || 'Mới bắt đầu'}
                          </div>
                          <img
                            className="card-image"
                            src={getCourseImage(course)}
                            alt={course.title}
                          />
                        </div>
                        <div className="card-content">
                          <h3 className="card-title">{course.title}</h3>
                          <p className="card-instructor">By {course.users?.full_name || 'Expert Instructor'}</p>
                          <div className="card-footer">
                            {!enrolledCourseIds.includes(course.id) && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {parseFloat(course.price || 0) === 0 ? (
                                  <span className="card-price" style={{ color: '#035c04ff', fontWeight: 700 }}>
                                    Miễn phí
                                  </span>
                                ) : course.discount_percentage && course.discount_percentage > 0 ? (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span className="card-price" style={{ color: '#035c04ff', fontWeight: 700 }}>
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
                                  <span className="card-price" style={{ color: 'var(--primary)' }}>
                                    {parseFloat(course.price).toLocaleString('vi-VN')} đ
                                  </span>
                                )}
                              </div>
                            )}
                            <button

                              className="enroll-btn"
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
                                : (enrollingCourseId === course.id ? 'Đang đăng ký...' : 'Đăng Ký')}
                            </button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--outline-variant, #e5e7eb)',
                          backgroundColor: 'white',
                          color: currentPage === 1 ? '#9ca3af' : 'var(--primary, #2563eb)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: currentPage === 1 ? 0.6 : 1
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: currentPage === page ? 'var(--primary, #2563eb)' : '#e5e7eb',
                            backgroundColor: currentPage === page ? 'var(--primary, #2563eb)' : 'white',
                            color: currentPage === page ? 'white' : '#374151',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--outline-variant, #e5e7eb)',
                          backgroundColor: 'white',
                          color: currentPage === totalPages ? '#9ca3af' : 'var(--primary, #2563eb)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: currentPage === totalPages ? 0.6 : 1
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
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
