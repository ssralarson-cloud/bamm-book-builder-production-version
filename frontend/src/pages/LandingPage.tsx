import { useNavigate } from '@tanstack/react-router';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCreateNewTale = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
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
    </div>
  );
}
