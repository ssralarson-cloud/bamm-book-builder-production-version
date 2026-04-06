import './Footer.css';

export default function Footer() {
  return (
    <footer className="simple-footer">
      <div className="container flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex items-center gap-2 text-sm simple-footer-text">
          <span>© 2025</span>
        </div>
        <div className="flex items-center gap-2 text-sm simple-footer-text">
          <span>Built with love using</span>
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="simple-link"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
