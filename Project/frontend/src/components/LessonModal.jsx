import { useState, useEffect } from 'react';
export default function LessonModal({ isOpen, onClose, onSubmit, editingLesson, submitting, getMuxBadgeText }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_preview: false
  });
  const [video, setVideo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editingLesson) {
        setFormData({
          title: editingLesson.title || '',
          content: editingLesson.content || '',
          is_preview: editingLesson.is_preview || false
        });
      } else {
        setFormData({
          title: '',
          content: '',
          is_preview: false
        });
      }
      setVideo(null);
    }
  }, [editingLesson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, video);
  };

  return (
    <div className="ic-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="ic-modal card animate-fade-in-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="ic-modal-header">
          <h2 className="font-headline-md">{editingLesson ? 'Sửa bài học' : 'Thêm bài học mới'}</h2>
          <button className="ic-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="ic-modal-form">
          <div className="ic-form-grid">
            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Tiêu đề bài học *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập tiêu đề bài học..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="ic-form-group ic-form-full">
              <label className="custom-checkbox-row">
                <input
                  type="checkbox"
                  className="custom-checkbox-input"
                  checked={formData.is_preview}
                  onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
                />
                <span className="font-body-sm">Cho phép học viên học thử (Free Preview)</span>
              </label>
            </div>

            <div className="ic-form-group ic-form-full">
              <label className="font-label-md">Nội dung bài học / Bài giảng lý thuyết</label>
              <textarea
                className="input-field ic-textarea"
                placeholder="Mô tả lý thuyết bài học hoặc nội dung đi kèm..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            {/* Video upload row */}
            <div className="ic-form-group ic-form-full" style={{ border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <label className="font-label-md" style={{ display: 'block', marginBottom: '8px' }}>
                Video bài giảng (Hỗ trợ định dạng MP4, MKV, AVI, MOV...)
              </label>
              <input
                type="file"
                accept="video/*"
                id="lesson-video-upload"
                style={{ display: 'none' }}
                onChange={(e) => setVideo(e.target.files[0] || null)}
              />
              <label htmlFor="lesson-video-upload" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600 }}>
                <span className="material-symbols-outlined">video_library</span>
                <span style={{ fontSize: '14px' }}>
                  {video ? video.name : 'Chọn file video tải lên...'}
                </span>
              </label>
              {editingLesson && editingLesson.mux_status && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--outline)' }}>
                  Trạng thái video hiện tại: <strong>{getMuxBadgeText(editingLesson.mux_status)}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="ic-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> Đang tải lên và xử lý...</>
              ) : (
                editingLesson ? 'Cập nhật bài học' : 'Thêm bài học'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
