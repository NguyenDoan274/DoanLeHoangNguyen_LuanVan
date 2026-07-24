export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container-max">
        <div className="footer-grid">
          <div className="footer-brand">
            <h4 className="font-headline-sm" style={{ color: 'var(--primary)' }}>EduPro</h4>
            <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>
              Trao quyền cho thế hệ lãnh đạo ngành tiếp theo thông qua nền giáo dục chất lượng.
            </p>
          </div>
     
        </div>
        <div className="footer-bottom">
          <p className="font-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Mọi thắc mắc vui lòng liên hệ: dlhnguyen26@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
}
