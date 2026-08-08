import { useState, useEffect } from 'react';

export default function CourseEditModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  submitting
}) {
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category_id: '',
    level: 'BEGINNER',
    price: 0,
    status: 'DRAFT'
  });
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData.title || '',
        short_description: initialData.short_description || '',
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        level: initialData.level || 'BEGINNER',
        price: initialData.price || 0,
        status: initialData.status || 'DRAFT'
      });
      setThumbnail(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, thumbnail);
  };

  return (
    <div className="ic-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="ic-modal-header">
          <h2 className="font-headline-md">Sửa thông tin khóa học</h2>
          <button className="ic-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="ic-modal-form">
          <div className="ic-form-grid">
            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Tiêu đề khóa học *</label>
              <input
                className="input-field"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề..."
                required
              />
            </div>

            <div className="ic-form-group">
              <label className="font-label-md">Danh mục *</label>
              <select
                className="input-field"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.filter(c => !c.parent_id).map((rootCat) => {
                  const subCats = categories.filter(c => c.parent_id === rootCat.id);
                  if (subCats.length === 0) {
                    return (
                      <option key={rootCat.id} value={rootCat.id}>
                         {rootCat.name}
                      </option>
                    );
                  }
                  return (
                    <optgroup key={rootCat.id} label={` ${rootCat.name}`}>
                      <option value={rootCat.id}>{rootCat.name} (Tất cả / Chung)</option>
                      {subCats.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          -- {subCat.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="ic-form-group">
              <label className="font-label-md">Cấp độ</label>
              <select
                className="input-field"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="BEGINNER">Sơ cấp</option>
                <option value="INTERMEDIATE">Trung cấp</option>
                <option value="ADVANCED">Cao cấp</option>
              </select>
            </div>

            <div className="ic-form-group">
              <label className="font-label-md">Giá tiền (VNĐ)</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="ic-form-group">
              <label className="font-label-md">Trạng thái</label>
              <select
                className="input-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="DRAFT">Nháp (Draft)</option>
                <option value="PUBLISHED">Xuất bản (Published)</option>
                <option value="HIDDEN">Ẩn (Hidden)</option>
              </select>
            </div>

            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Mô tả ngắn</label>
              <input
                className="input-field"
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Mô tả tóm tắt khóa học..."
              />
            </div>

            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Mô tả chi tiết</label>
              <textarea
                className="input-field ic-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết nội dung, kỹ năng, mục tiêu học..."
              />
            </div>

            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Ảnh bìa khóa học</label>
              <div className="ic-file-upload">
                <input
                  type="file"
                  accept="image/*"
                  id="course-thumbnail-upload"
                  className="ic-file-input"
                  onChange={(e) => setThumbnail(e.target.files[0] || null)}
                />
                <label htmlFor="course-thumbnail-upload" className="ic-file-label">
                  <span className="material-symbols-outlined">cloud_upload</span>
                  <span>{thumbnail ? thumbnail.name : 'Chọn file hình ảnh bìa...'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ic-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...</>
              ) : (
                'Cập nhật'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
