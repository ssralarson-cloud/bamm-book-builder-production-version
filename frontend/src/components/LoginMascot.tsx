import './LoginMascot.css';

interface LoginMascotProps {
  message?: string;
}

export default function LoginMascot({ message = 'Welcome!' }: LoginMascotProps) {
  return (
    <div className="simple-mascot">
      <div className="simple-mascot-container">
        <div className="simple-mascot-content">
          <h3 className="simple-mascot-title">Greetings, Storyteller!</h3>
          <p className="simple-mascot-message">{message}</p>
        </div>
      </div>
    </div>
  );
}
