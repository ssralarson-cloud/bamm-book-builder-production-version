import './LoginMascot.css';

interface LoginMascotProps {
  message?: string;
}

export default function LoginMascot({ message = 'Welcome to Bamm Book Builder!' }: LoginMascotProps) {
  return (
    <div className="forest-mascot">
      <div className="forest-mascot-container">
        <img 
          src="/assets/generated/bear-icon.dim_64x64.png" 
          alt="Bear Mascot" 
          className="forest-mascot-image"
        />
        <div className="forest-mascot-content">
          <h3 className="forest-mascot-title">Welcome!</h3>
          <p className="forest-mascot-message">{message}</p>
          <div className="forest-mascot-decoration">
            <img 
              src="/assets/generated/owl-icon.dim_64x64.png" 
              alt="Owl Icon" 
              className="forest-owl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
