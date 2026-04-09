import { Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="simple-footer">
      <div className="container flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="flex items-center gap-2 simple-footer-text">
          <span>&#x1F33F;</span>
          <span>2025 BAM Book Builder</span>
          <span>&#x1F33F;</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm simple-footer-text">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 text-blush-400 fill-blush-400" />
          <span>using</span>
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="simple-link"
          >
            Caffeine AI
          </a>
        </div>
      </div>
    </footer>
  );
}
