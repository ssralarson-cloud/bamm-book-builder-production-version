import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  checkSubscription,
  createCheckoutSession,
  createEmailCheckoutSession,
  type SubscriptionStatus,
} from '../utils/checkSubscription';
import { toast } from 'sonner';
import './SubscribePage.css';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { identity, loginStatus } = useInternetIdentity();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [email, setEmail] = useState('');

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal().toString();

  // Check subscription for authenticated users
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

  // Auto-proceed to Stripe for authenticated non-subscribed users
  useEffect(() => {
    if (isAuthenticated && userPrincipal && !subscriptionStatus?.isActive && !isLoading) {
      handlePrincipalCheckout();
    }
  }, [isAuthenticated, userPrincipal, isLoading]);

  const handlePrincipalCheckout = async () => {
    if (!userPrincipal) return;

    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const session = await createCheckoutSession(
        userPrincipal,
        `${baseUrl}/subscription-success`,
        `${baseUrl}/subscribe`
      );
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsCreatingSession(false);
    }
  };

  const handleEmailCheckout = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const session = await createEmailCheckoutSession(
        trimmed,
        `${baseUrl}/subscription-success`,
        `${baseUrl}/subscribe`
      );
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating email checkout session:', error);
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

  // Loading state for authenticated users
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

  // Main subscribe view — works for everyone (no account required)
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

        <div className="subscribe-checkout-section">
          <div className="subscribe-email-field">
            <Label htmlFor="checkout-email" className="subscribe-label">
              Your email address
            </Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEmailCheckout();
              }}
              className="subscribe-input"
              disabled={isCreatingSession}
            />
          </div>

          <button
            className="subscribe-cta"
            onClick={handleEmailCheckout}
            disabled={isCreatingSession || !email.trim()}
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
        </div>

        <p className="subscribe-note">Secure checkout powered by Stripe</p>
      </div>
    </div>
  );
}
