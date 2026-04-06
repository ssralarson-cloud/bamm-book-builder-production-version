import { Link, useNavigate } from '@tanstack/react-router';
import { Home, FlaskConical, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActorExtended';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { isInitialized } = useActor();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isInitializing = loginStatus === 'initializing' || (isAuthenticated && !isInitialized);
  const isLoggingIn = loginStatus === 'logging-in';
  const disabled = isLoggingIn || isInitializing;
  
  const buttonText = isLoggingIn 
    ? 'Entering...' 
    : isInitializing
    ? 'Preparing...'
    : isAuthenticated 
    ? 'Leave the Forest' 
    : 'Enter the Forest';

  const handleAuth = async () => {
    if (isAuthenticated) {
      console.log('[Header] Logging out');
      await clear();
      queryClient.clear();
      toast.success('You have left the forest');
      navigate({ to: '/' });
    } else {
      try {
        console.log('[Header] Initiating login');
        await login();
        toast.success('Welcome to the Black Forest!');
      } catch (error: any) {
        console.error('[Header] Login error:', error);
        if (error.message === 'User is already authenticated') {
          console.log('[Header] User already authenticated, clearing and retrying');
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Could not enter the forest. Please try again.');
        }
      }
    }
  };

  return (
    <header className="forest-header">
      <div className="forest-header-border"></div>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img 
            src="/assets/generated/gnome-logo.dim_200x200.png" 
            alt="Gnome Logo" 
            className="h-12 w-12 forest-crest" 
          />
          <div className="flex flex-col">
            <span className="forest-title">Bamm Book Builder</span>
            <span className="forest-subtitle">Tales from the Black Forest</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="forest-nav-button">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/subscribe' })} className="forest-nav-button">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscribe
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/test' })} className="forest-nav-button">
            <FlaskConical className="mr-2 h-4 w-4" />
            Tests
          </Button>
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            onClick={handleAuth}
            disabled={disabled}
            className="forest-auth-button"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buttonText}
              </>
            ) : (
              <>
                <span className="forest-icon">🌲</span>
                {buttonText}
              </>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
