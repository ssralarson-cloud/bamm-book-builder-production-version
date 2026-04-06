import { Link, useNavigate } from '@tanstack/react-router';
import { CreditCard, Loader2 } from 'lucide-react';
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
      console.log('[Header] Logging out');
      await clear();
      queryClient.clear();
      toast.success('Signed out successfully');
      navigate({ to: '/' });
    } else {
      try {
        console.log('[Header] Initiating login');
        await login();
        toast.success('Welcome to Bamm Book Builder!');
      } catch (error: any) {
        console.error('[Header] Login error:', error);
        if (error.message === 'User is already authenticated') {
          console.log('[Header] User already authenticated, clearing and retrying');
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Sign in failed. Please try again.');
        }
      }
    }
  };

  return (
    <header className="site-header">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="header-brand">
          <img
            src="/assets/generated/owl-icon.dim_64x64.png"
            alt="Bamm Book Builder"
            className="header-logo"
          />
          <span className="header-title">Bamm Book Builder</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/subscribe' })} className="header-nav-link">
            <CreditCard className="mr-1.5 h-4 w-4" />
            Pricing
          </Button>
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            onClick={handleAuth}
            disabled={disabled}
            className="header-auth-button"
          >
            {(isLoggingIn || isInitializing) && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {buttonText}
          </Button>
        </nav>
      </div>
    </header>
  );
}
