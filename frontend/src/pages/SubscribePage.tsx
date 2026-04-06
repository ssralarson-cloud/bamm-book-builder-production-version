import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowLeft, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { checkSubscription, createCheckoutSession, type SubscriptionStatus } from '../utils/checkSubscription';
import { toast } from 'sonner';
import './SubscribePage.css';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal().toString();
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (!isAuthenticated || !userPrincipal) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const status = await checkSubscription(userPrincipal);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        toast.error('Failed to check subscription status');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionStatus();
  }, [isAuthenticated, userPrincipal]);

  // Auto-proceed to checkout after successful login on subscribe page
  useEffect(() => {
    if (isAuthenticated && userPrincipal && !subscriptionStatus?.isActive && !isLoading) {
      handleSubscribe();
    }
  }, [isAuthenticated, userPrincipal, isLoading]);

  const handleSubscribe = async () => {
    if (!userPrincipal) return;

    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/subscription-success`;
      const cancelUrl = `${baseUrl}/subscribe`;

      const session = await createCheckoutSession(userPrincipal, successUrl, cancelUrl);
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsCreatingSession(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Active subscription view
  if (isAuthenticated && subscriptionStatus?.isActive) {
    return (
      <div className="subscribe-page">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/home' })}
          className="subscribe-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="subscribe-card subscribe-card-active">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="font-display text-2xl">Active Subscription</CardTitle>
                <CardDescription>You have full access to all features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{subscriptionStatus.status}</span>
              </div>
              {subscriptionStatus.startDate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">{formatDate(subscriptionStatus.startDate)}</span>
                </div>
              )}
              {subscriptionStatus.endDate && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Renews</span>
                  <span className="font-medium">{formatDate(subscriptionStatus.endDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate({ to: '/home' })} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isAuthenticated && (loginStatus === 'initializing' || isLoading || isCreatingSession)) {
    return (
      <div className="subscribe-page">
        <div className="subscribe-loading">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#7a6c5d' }} />
          <p>{isCreatingSession ? 'Starting Stripe checkout...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Main subscribe view (not authenticated or has lapsed subscription)
  return (
    <div className="subscribe-page">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/' })}
        className="subscribe-back"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="subscribe-header">
        <h1>Start Publishing Today</h1>
        <p>One simple plan. No hidden fees. Cancel anytime.</p>
      </div>

      {subscriptionStatus?.hasSubscription && !subscriptionStatus.isActive && (
        <Alert className="subscribe-alert">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription is currently {subscriptionStatus.status}. Subscribe again to regain access.
          </AlertDescription>
        </Alert>
      )}

      <div className="subscribe-card">
        <div className="subscribe-price-section">
          <span className="subscribe-price">$9.99</span>
          <span className="subscribe-price-period">/month</span>
        </div>

        <ul className="subscribe-features">
          {[
            'Unlimited book projects',
            'AI-powered illustration prompts',
            'KDP-ready PDF export',
            'Priority support',
            'Cancel anytime',
          ].map((feature, i) => (
            <li key={i}>
              <CheckCircle size={18} />
              {feature}
            </li>
          ))}
        </ul>

        {!isAuthenticated ? (
          <div className="subscribe-auth-section">
            <p className="subscribe-auth-info">
              Create a free account to get started. Quick and secure — just use your fingerprint, face, or security key. No passwords needed.
            </p>
            <button
              className="subscribe-cta"
              onClick={() => login()}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Fingerprint size={18} />
                  Create Account & Subscribe
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            className="subscribe-cta"
            onClick={handleSubscribe}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Starting checkout...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Subscribe Now — $9.99/month
              </>
            )}
          </button>
        )}

        <p className="subscribe-note">Secure checkout powered by Stripe</p>
      </div>
    </div>
  );
}
