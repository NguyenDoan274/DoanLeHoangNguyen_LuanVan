import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/CourseExplorer.css';
import '../css/RoadmapExplorer.css';

const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';

export default function RoadmapExplorer() {
  const [categories, setCategories] = useState([]);
  const [courseGroups, setCourseGroups] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const catRes = await fetch(`${API_BASE}/api/categories`);
        const catJson = await catRes.json();
        if (catRes.ok) {
          setCategories(catJson.data || []);
        }

        // Fetch course groups
        const groupRes = await fetch(`${API_BASE}/api/course-groups`);
        const groupJson = await groupRes.json();
        if (groupRes.ok) {
          setCourseGroups(groupJson.data || []);
        }
      } catch (err) {
        console.error("Error fetching roadmap explorer data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const getCategoryCount = (catId) => {
    if (catId === 'All') return courseGroups.length;
    return courseGroups.filter(g => g.category_id === catId).length;
  };

  // Filter roadmaps by category and search query
  const filteredGroups = courseGroups.filter(group => {
    const matchesCategory = selectedCategory === 'All' 
      ? true 
      : group.category_id === selectedCategory;

    const matchesSearch = searchQuery
      ? group.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  const roadmapsPerPage = 6;
  const totalPages = Math.ceil(filteredGroups.length / roadmapsPerPage);
  const indexOfLastRoadmap = currentPage * roadmapsPerPage;
  const indexOfFirstRoadmap = indexOfLastRoadmap - roadmapsPerPage;
  const currentRoadmaps = filteredGroups.slice(indexOfFirstRoadmap, indexOfLastRoadmap);

  const activeCategoryObj = categories.find(cat => cat.id === selectedCategory);
  const explorerTitle = selectedCategory === 'All' ? 'Khám phá lộ trình' : (activeCategoryObj?.name || 'Category');
  const explorerDescription = selectedCategory === 'All'
    ? 'Chinh phục kỹ năng mới theo lộ trình học tập bài bản được thiết kế từ các chuyên gia hàng đầu.'
    : (activeCategoryObj?.description || 'Lộ trình chuyên nghiệp từ chuyên gia.');

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main style={{ flexGrow: 1 }}>
        <div className="explorer-container">
          {/* Breadcrumbs */}
          <nav className="explorer-breadcrumbs">
            <Link to="/">Trang chủ</Link>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            <span className="current">{explorerTitle}</span>
          </nav>

          <div className="explorer-layout">
            {/* Sidebar Explorer */}
            <aside className="explorer-sidebar">
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
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <div
                        className={`category-filter-item ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <span>{cat.name}</span>
                        <span className="category-count">{getCategoryCount(cat.id)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
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
                  Hiển thị <strong>{filteredGroups.length}</strong> lộ trình
                </p>
                <div className="sort-wrapper">
                  <span>Tìm kiếm:</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm lộ trình..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius)',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface-container-lowest)',
                      color: 'var(--on-surface)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Roadmaps Grid */}
              {loading ? (
                <div className="ic-loading" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>sync</span>
                  <span>Đang tải...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="ic-empty card" style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)' }}>library_books</span>
                  <h3 className="font-headline-sm" style={{ marginTop: 16 }}>Không tìm thấy lộ trình</h3>
                  <p className="font-body-sm text-muted">Không có lộ trình học tập nào phù hợp với bộ lọc đang hoạt động.</p>
                </div>
              ) : (
                <>
                  <div className="explorer-grid">
                    {currentRoadmaps.map((group) => {
                      const categoryObj = categories.find(c => c.id === group.category_id);
                      return (
                        <Link key={group.id} to={`/roadmaps/${group.id}`} className="explorer-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="card-content">
                            {categoryObj && (
                              <div className="level-tag" style={{ position: 'static', display: 'inline-block', width: 'fit-content', marginBottom: 12 }}>
                                {categoryObj.name}
                              </div>
                            )}
                            <h3 className="card-title" style={{ minHeight: 'auto', marginBottom: 12 }}>{group.title}</h3>
                            {group.description && (
                              <p className="font-body-sm" style={{ margin: '0 0 16px 0', color: 'var(--on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {group.description}
                              </p>
                            )}
                            
                            {/* Numbered steps of courses */}
                            <div className="roadmap-steps-list" style={{ margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {group.course_group_items?.slice(0, 3).map((item, i) => (
                                <div key={item.course_id} className="roadmap-step-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span className="step-num" style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(30, 64, 175, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{i + 1}</span>
                                  <span className="step-title" style={{ fontSize: 13, color: 'var(--on-surface)' }}>{item.courses?.title}</span>
                                </div>
                              ))}
                              {group.course_group_items?.length > 3 && (
                                <div className="roadmap-step-item" style={{ opacity: 0.6, paddingLeft: 8, fontSize: 12 }}>
                                  <span>+ {group.course_group_items.length - 3} khóa học khác</span>
                                </div>
                              )}
                            </div>

                            <div className="card-footer">
                              <span className="card-price" style={{ fontSize: 16 }}>
                                {group.course_group_items?.length || 0} Khóa học
                              </span>
                              <span className="enroll-btn" style={{ fontSize: 12, padding: '6px 12px' }}>
                                Chi tiết
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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
    </div>
  );
}
