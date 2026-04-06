import './LoadingAnimation.css';

interface LoadingAnimationProps {
  message?: string;
}

export default function LoadingAnimation({ message = 'Summoning woodland magic…' }: LoadingAnimationProps) {
  return (
    <div className="forest-loading">
      <div className="forest-loading-container">
        <img 
          src="/assets/generated/quill-icon.dim_32x32.png" 
          alt="Quill" 
          className="forest-quill"
        />
        <p className="forest-loading-text">{message}</p>
      </div>
    </div>
  );
}
