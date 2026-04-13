import "./LoadingAnimation.css";

interface LoadingAnimationProps {
  message?: string;
}

export default function LoadingAnimation({
  message = "Loading...",
}: LoadingAnimationProps) {
  return (
    <div className="simple-loading">
      <div className="simple-loading-container">
        <div className="simple-spinner" />
        <p className="simple-loading-text">{message}</p>
      </div>
    </div>
  );
}
