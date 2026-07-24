import { useState, useEffect } from 'react';

export default function ChapterModal({
  isOpen,
  onClose,
  onSubmit,
  editingChapter,
  submitting
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (editingChapter) {
        setFormData({
          title: editingChapter.title || '',
          description: editingChapter.description || ''
        });
      } else {
        setFormData({
          title: '',
          description: ''
        });
      }
    }
  }, [editingChapter, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="ic-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="ic-modal-header">
          <h2 className="font-headline-md">{editingChapter ? 'Sửa chương học' : 'Thêm chương học mới'}</h2>
          <button className="ic-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="ic-modal-form">
          <div className="ic-form-grid">
            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Tên chương học *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: Chương 1: Nền tảng phân tích..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Mô tả tóm tắt chương học</label>
              <textarea
                className="input-field ic-textarea"
                placeholder="Mô tả nội dung chương học này sẽ học những gì..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="ic-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...</>
              ) : (
                editingChapter ? 'Cập nhật' : 'Thêm chương'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
