import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="site-footer-text">&copy; 2026 Bamm Book Builder</span>
        <span className="site-footer-divider">&middot;</span>
        <span className="site-footer-text">
          Built with{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-link"
          >
            caffeine.ai
          </a>
        </span>
      </div>
    </footer>
  );
}
