import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { checkSubscription, createCheckoutSession, type SubscriptionStatus } from '../utils/checkSubscription';
import { toast } from 'sonner';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal().toString();

  // Check subscription status on mount and when authentication changes
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

  const handleSubscribe = async () => {
    if (!userPrincipal) {
      toast.error('Please log in to subscribe');
      return;
    }

    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/subscription-success`;
      const cancelUrl = `${baseUrl}/subscribe`;

      const session = await createCheckoutSession(userPrincipal, successUrl, cancelUrl);
      
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
      setIsCreatingSession(false);
    }
  };

  const handleLoginPrompt = () => {
    toast.info('Please log in with Internet Identity to subscribe');
    login();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/home' })}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="text-center mb-8">
        <h1 className="font-display text-4xl mb-3">Subscription</h1>
        <p className="text-lg text-muted-foreground">
          Unlock premium features for your book creation journey
        </p>
      </div>

      {loginStatus === 'initializing' || isLoading ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading subscription information...</p>
          </CardContent>
        </Card>
      ) : !isAuthenticated ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground opacity-40 mb-4" />
            <h3 className="font-display text-xl mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6">
              Please log in with Internet Identity to manage your subscription
            </p>
            <Button onClick={handleLoginPrompt} size="lg">
              Log In with Internet Identity
            </Button>
          </CardContent>
        </Card>
      ) : subscriptionStatus?.isActive ? (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="font-display text-2xl">Active Subscription</CardTitle>
                <CardDescription>You have full access to all premium features</CardDescription>
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
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          {subscriptionStatus?.hasSubscription && !subscriptionStatus.isActive && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your subscription is currently {subscriptionStatus.status}. Subscribe again to regain access to premium features.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-3xl mb-2">Premium Subscription</CardTitle>
              <CardDescription className="text-lg">
                Unlock the full potential of Bamm Book Builder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="text-5xl font-bold mb-2">$9.99</div>
                <div className="text-muted-foreground">per month</div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-lg mb-3">Premium Features:</h4>
                <div className="space-y-2">
                  {[
                    'Unlimited book projects',
                    'AI-powered illustration prompts',
                    'Advanced export options',
                    'Priority support',
                    'Early access to new features',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubscribe}
                disabled={isCreatingSession}
                size="lg"
                className="w-full"
              >
                {isCreatingSession ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Secure payment processing powered by Stripe. Cancel anytime.
          </p>
        </div>
      )}
    </div>
  );
}
