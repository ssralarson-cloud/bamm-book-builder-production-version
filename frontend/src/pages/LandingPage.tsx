import { useNavigate } from '@tanstack/react-router';
import { AssetImage } from '@/components/AssetImage';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCreateNewTale = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <AssetImage 
            name="owl-icon" 
            alt="Forest Owl" 
            className="hero-owl"
          />
          <h1 className="hero-title">
            Bamm Book Builder
          </h1>
          <p className="hero-subtitle">
            Create timeless children's books for print.
          </p>
          <button 
            className="hero-button"
            onClick={handleCreateNewTale}
          >
            Create New Tale
          </button>
        </div>
      </section>

      {/* Footer Twig */}
      <div className="footer-twig">
        <AssetImage 
          name="border-twig" 
          alt="Forest Border" 
          className="twig-image"
        />
      </div>
    </div>
  );
}
