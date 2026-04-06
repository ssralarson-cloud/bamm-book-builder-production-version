import { useNavigate } from '@tanstack/react-router';
import { AssetImage } from '@/components/AssetImage';
import { BookOpen, Palette, FileDown, CheckCircle, Shield, Sparkles, Download } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <AssetImage
            name="owl-icon"
            alt="Bamm Book Builder Owl"
            className="hero-owl"
          />
          <h1 className="hero-title">
            Create Beautiful Children's Books
          </h1>
          <p className="hero-subtitle">
            From story to print-ready PDF — designed for Amazon KDP,
            crafted with love.
          </p>
          <div className="hero-buttons">
            <button
              className="hero-button"
              onClick={() => navigate({ to: '/home' })}
            >
              Start Creating
            </button>
            <button
              className="hero-button-secondary"
              onClick={() => navigate({ to: '/subscribe' })}
            >
              See Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider">
        <span className="divider-line" />
        <span className="divider-ornament">&#10045;</span>
        <span className="divider-line" />
      </div>

      {/* Features */}
      <section className="features-section">
        <span className="section-label">What You Get</span>
        <h2 className="section-title">Everything you need to publish</h2>
        <p className="section-subtitle">
          Write, illustrate, and export — all in one place.
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <BookOpen className="feature-icon" />
            </div>
            <h3>Write Your Story</h3>
            <p>Paste or type your story and we'll auto-split it into print-ready pages with proper margins.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Palette className="feature-icon" />
            </div>
            <h3>Add Illustrations</h3>
            <p>Upload your artwork or use AI-powered prompts. Built-in DPI checks ensure print quality.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileDown className="feature-icon" />
            </div>
            <h3>Export for KDP</h3>
            <p>Generate interior and cover PDFs in the exact 8.5 x 8.5" format Amazon KDP requires.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <span className="section-label">Simple Process</span>
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">
          Three steps from idea to published book.
        </p>
        <div className="steps-row">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Create a Project</h3>
            <p>Enter your title and story. We handle the formatting and page layout.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Design Your Pages</h3>
            <p>Add images, adjust layouts, and build your cover — front and back.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Export & Publish</h3>
            <p>Download KDP-compliant PDFs and upload directly to Amazon.</p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="trust-section">
        <div className="trust-row">
          <div className="trust-item">
            <Shield className="trust-icon" size={18} />
            <span>Secure payments via Stripe</span>
          </div>
          <div className="trust-item">
            <Sparkles className="trust-icon" size={18} />
            <span>AI-powered illustrations</span>
          </div>
          <div className="trust-item">
            <Download className="trust-icon" size={18} />
            <span>KDP-ready PDF export</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <span className="section-label">Pricing</span>
        <h2 className="section-title">Start publishing today</h2>
        <p className="section-subtitle">
          One simple plan. No hidden fees. Cancel anytime.
        </p>
        <div className="pricing-card">
          <h2>Premium</h2>
          <div className="price-tag">$9.99<span> /mo</span></div>
          <ul className="pricing-features">
            <li><CheckCircle size={18} /> Unlimited book projects</li>
            <li><CheckCircle size={18} /> AI illustration prompts</li>
            <li><CheckCircle size={18} /> KDP-ready PDF export</li>
            <li><CheckCircle size={18} /> Priority support</li>
            <li><CheckCircle size={18} /> Cancel anytime</li>
          </ul>
          <button
            className="pricing-cta"
            onClick={() => navigate({ to: '/subscribe' })}
          >
            Subscribe Now
          </button>
          <p className="pricing-note">Secure checkout powered by Stripe</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <AssetImage
          name="owl-icon"
          alt="Bamm Book Builder"
          className="footer-logo"
        />
        <p>&copy; 2026 Bamm Book Builder. All rights reserved.</p>
      </footer>
    </div>
  );
}
