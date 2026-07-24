import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile Info States
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const defaultAvatar = 'https://i.pinimg.com/222x/2a/65/f9/2a65f948b71ff3a70e21c64bca10a312.jpg';

  const API_BASE = import.meta.env.VITE_URL_API || 'http://localhost:3000';
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token) {
      navigate('/login');
      return;
    }

    // Redirect /profile to their layout profile if role matches
    if (role === 'ADMIN' && location.pathname === '/profile') {
      navigate('/admin/profile', { replace: true });
      return;
    }
    if (role === 'INSTRUCTOR' && location.pathname === '/profile') {
      navigate('/instructor/profile', { replace: true });
      return;
    }

    fetchProfile();
  }, [navigate, location.pathname]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setProfile(json.data);
        setFullName(json.data.full_name || '');
        if (json.data.avatar_url) {
          const url = json.data.avatar_url.startsWith('http') 
            ? json.data.avatar_url 
            : `${API_BASE}${json.data.avatar_url}`;
          setAvatarPreview(url);
        } else {
          setAvatarPreview(defaultAvatar);
        }
      } else {
        setError(json.message || 'Failed to fetch profile.');
      }
    } catch {
      setError('Connection error. Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('access_token');

    const formData = new FormData();
    formData.append('full_name', fullName);
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const json = await res.json();
      if (res.ok && json.profile) {
        setSuccess('Cập nhật thông tin thành công.');
        localStorage.setItem('user', JSON.stringify(json.profile));
        setProfile(json.profile);
        window.dispatchEvent(new Event('storage'));
      } else {
        setError(json.message || 'Cập nhật thông tin thất bại.');
      }
    } catch {
      setError('Có lỗi khi cập nhật thông tin.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/api/profile/change-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess('Cập nhật mật khẩu thành công.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }  else {
        setError(json.message || 'Cập nhật mật khẩu thất bại.');
      }
    } catch {
      setError('Lỗi khi cập nhật mật khẩu.');
    }
  };

  const isLayoutPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/instructor');

  const renderProfileContent = () => (
    <main className="profile-main-container container-max" style={isLayoutPage ? { padding: '24px 0' } : {}}>
      <aside className="profile-sidebar">
        <h1 className="font-headline-md sidebar-title">Settings</h1>
        <nav className="sidebar-nav-menu">
          <button 
            className={`sidebar-nav-btn ${activeTab === 'public' ? 'sidebar-item-active' : ''}`}
            onClick={() => { setActiveTab('public'); setError(''); setSuccess(''); }}
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className="font-label-md">Thông tin cá nhân</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'account' ? 'sidebar-item-active' : ''}`}
            onClick={() => { setActiveTab('account'); setError(''); setSuccess(''); }}
          >
            <span className="material-symbols-outlined">lock_reset</span>
            <span className="font-label-md">Tài khoản và bảo mật</span>
          </button>
        </nav>
      </aside>

      <div className="profile-content-area">
        {/* Notification Messages */}
        {error && (
          <div className="profile-alert profile-alert-error animate-fade-in">
            <span className="material-symbols-outlined">error</span>
            <span className="font-body-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="profile-alert profile-alert-success animate-fade-in">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-body-sm">{success}</span>
          </div>
        )}

        {loading ? (
          <div className="profile-loading">
            <span className="material-symbols-outlined animate-spin">sync</span>
            <span>Loading details...</span>
          </div>
        ) : (
          <>
            {/* Tab: Public Profile */}
            {activeTab === 'public' && (
              <section className="profile-section card animate-fade-in-up">
                <div className="section-header">
                  <h2 className="font-headline-sm">Thông tin cá nhân</h2>
                </div>
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="avatar-uploader-container">
                    <div className="avatar-preview-wrapper group">
                      <img className="profile-avatar-img" id="avatar-preview" src={avatarPreview} alt="Avatar" />
                      <label className="avatar-upload-overlay" htmlFor="avatar-upload">
                        <span className="material-symbols-outlined">photo_camera</span>
                        <span className="upload-text">Đổi ảnh</span>
                      </label>
                      <input accept="image/*" className="hidden" id="avatar-upload" type="file" onChange={handleAvatarChange} />
                    </div>
                    <p className="avatar-tip font-body-sm">JPG, GIF or PNG. Max size of 5MB.</p>
                  </div>

                  <div className="form-fields-grid">
                    <div className="form-group">
                      <label className="text-label-md font-semibold">Họ tên</label>
                      <input 
                        className="input-field" 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="text-label-md font-semibold">Địa chỉ email</label>
                      <input 
                        className="input-field disabled-input" 
                        type="email" 
                        value={profile?.email || ''} 
                        disabled 
                      />
                    </div>
                  </div>

                  <div className="form-action-row">
                    <button className="btn btn-primary" type="submit">Lưu</button>
                  </div>
                </form>
              </section>
            )}

            {/* Tab: Account Settings */}
            {activeTab === 'account' && (
              <section className="profile-section card animate-fade-in-up">
                <div className="section-header security-header">
                  <div>
                    <h2 className="font-headline-sm">Tài khoản và bảo mật</h2>
                    <p className="font-body-sm text-muted">Thay đổi mật khẩu và quản lý tài khoản.</p>
                  </div>
                  <div className="role-badges">
                    <span className="badge badge-primary">Quyền: {profile?.role}</span>
                    <span className="badge badge-success">Trạng thái: {profile?.status}</span>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="security-form">
                  <h3 className="sub-section-title font-body-lg">Thay đổi mật khẩu</h3>
                  <div className="form-group">
                    <label className="text-label-md font-semibold">Mật khẩu hiện tại</label>
                    <div className="password-input-wrapper">
                      <input 
                        className="input-field" 
                        type={showCurrentPass ? 'text' : 'password'} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required 
                      />
                      <button type="button" className="pass-toggle-btn" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                        <span className="material-symbols-outlined">{showCurrentPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-fields-grid">
                    <div className="form-group">
                      <label className="text-label-md font-semibold">Mật khẩu mới</label>
                      <div className="password-input-wrapper">
                        <input 
                          className="input-field" 
                          type={showNewPass ? 'text' : 'password'} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          required 
                        />
                        <button type="button" className="pass-toggle-btn" onClick={() => setShowNewPass(!showNewPass)}>
                          <span className="material-symbols-outlined">{showNewPass ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="text-label-md font-semibold">Xác nhận mật khẩu mới</label>
                      <div className="password-input-wrapper">
                        <input 
                          className="input-field" 
                          type={showConfirmPass ? 'text' : 'password'} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required 
                        />
                        <button type="button" className="pass-toggle-btn" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                          <span className="material-symbols-outlined">{showConfirmPass ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-action-row">
                    <button className="btn btn-primary" type="submit">Thay đổi mật khẩu</button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );

  if (isLayoutPage) {
    return renderProfileContent();
  }

  return (
    <div className="profile-page-wrapper">
      <Header />
      {renderProfileContent()}
      <Footer />
    </div>
  );
}
