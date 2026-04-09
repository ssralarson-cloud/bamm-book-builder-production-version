import { Link, useNavigate } from '@tanstack/react-router';
import { Home, CreditCard, Loader2 } from 'lucide-react';
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
    ? 'Signing in...'
    : isInitializing
    ? 'Preparing...'
    : isAuthenticated
    ? 'Sign Out'
    : 'Sign In';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      toast.success('Signed out successfully');
      navigate({ to: '/' });
    } else {
      try {
        await login();
        toast.success('Welcome back!');
      } catch (error: any) {
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Could not sign in. Please try again.');
        }
      }
    }
  };

  return (
    <header className="simple-header">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="text-xl">&#x1F4DA;</span>
          <span className="simple-title">BAM Book Builder</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="simple-nav-button">
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/subscribe' })} className="simple-nav-button">
            <CreditCard className="mr-1.5 h-4 w-4" />
            Pricing
          </Button>
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            onClick={handleAuth}
            disabled={disabled}
            className="simple-auth-button"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {buttonText}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
