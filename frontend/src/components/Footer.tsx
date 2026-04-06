import './Footer.css';

export default function Footer() {
  return (
    <footer className="forest-footer">
      <div className="forest-footer-border"></div>
      <div className="container flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex items-center gap-2 text-sm forest-footer-text">
          <span>© 2025</span>
        </div>
        <div className="flex items-center gap-2 text-sm forest-footer-text">
          <span>Built with</span>
          <span className="forest-heart">❤️</span>
          <span>using</span>
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="forest-link"
          >
            caffeine.ai
          </a>
        </div>
        <p className="forest-tagline">
          Crafted in the Black Forest 🌲📖
        </p>
      </div>
    </footer>
  );
}
