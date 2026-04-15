import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// Use the EXTENDED hook so we get isInitialized / isAuthenticated flags
// and a stable actor reference that doesn't race on navigation.
import { useActor } from "../hooks/useActorExtended";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type SubscriptionStatus,
  checkSubscription,
  createCheckoutSession,
  createEmailCheckoutSession,
} from "../utils/checkSubscription";
import "./SubscribePage.css";

export default function SubscribePage() {
  const navigate = useNavigate();
  const { identity, loginStatus } = useInternetIdentity();
  // Use extended hook — guarantees actor is ready before _devAdminGrant is callable
  const { actor, isInitialized } = useActor();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [email, setEmail] = useState("");

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const userPrincipal = isAuthenticated
    ? identity.getPrincipal().toString()
    : undefined;

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
      } catch {
        toast.error("Failed to check subscription status");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscriptionStatus();
  }, [isAuthenticated, userPrincipal]);

  const handlePrincipalCheckout = async () => {
    if (!userPrincipal) return;
    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const session = await createCheckoutSession(
        userPrincipal,
        `${baseUrl}/subscription-success`,
        `${baseUrl}/subscribe`,
      );
      window.location.href = session.url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setIsCreatingSession(false);
    }
  };

  const handleEmailCheckout = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsCreatingSession(true);
    try {
      const baseUrl = window.location.origin;
      const session = await createEmailCheckoutSession(
        trimmed,
        `${baseUrl}/subscription-success`,
        `${baseUrl}/subscribe`,
      );
      window.location.href = session.url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setIsCreatingSession(false);
    }
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleDevAdminGrant = async () => {
    // Gate on isInitialized (not just actor presence) to ensure the actor
    // has a non-anonymous identity attached before calling _devAdminGrant
    if (!actor || !isInitialized || !isAuthenticated) {
      toast.error("Please wait for the session to be ready and log in first.");
      return;
    }

    // Guard: check the method exists on this version of the canister
    const actorAsAny = actor as unknown as Record<string, unknown>;
    if (typeof actorAsAny._devAdminGrant !== "function") {
      toast.error(
        "Dev admin grant not available on this canister version. Please redeploy the backend.",
      );
      return;
    }

    setIsClaimingAdmin(true);
    try {
      await actor._devAdminGrant();
      toast.success(
        "Admin access granted! Refresh to see updated permissions.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to claim admin: ${msg}`);
    } finally {
      setIsClaimingAdmin(false);
    }
  };

  // Active subscription
  if (isAuthenticated && subscriptionStatus?.isActive) {
    return (
      <div className="subscribe-page">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/home" })}
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
                <CardTitle className="font-display text-2xl">
                  Active Subscription
                </CardTitle>
                <CardDescription>
                  You have full access to all features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  {subscriptionStatus.status}
                </span>
              </div>
              {subscriptionStatus.startDate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">
                    {formatDate(subscriptionStatus.startDate)}
                  </span>
                </div>
              )}
              {subscriptionStatus.endDate && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Renews</span>
                  <span className="font-medium">
                    {formatDate(subscriptionStatus.endDate)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/home" })}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state
  if (
    isAuthenticated &&
    (loginStatus === "initializing" || isLoading || isCreatingSession)
  ) {
    return (
      <div className="subscribe-page">
        <div className="subscribe-loading">
          <Loader2
            className="h-10 w-10 animate-spin"
            style={{ color: "#7a6c5d" }}
          />
          <p>
            {isCreatingSession ? "Starting Stripe checkout..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribe-page">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/" })}
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
            Your subscription is currently {subscriptionStatus.status}.
            Subscribe again to regain access.
          </AlertDescription>
        </Alert>
      )}

      <div className="subscribe-card">
        <div className="subscribe-price-section">
          <span className="subscribe-price">$19.99</span>
          <span className="subscribe-price-period">/book</span>
        </div>

        <ul className="subscribe-features">
          {[
            "Unlimited book projects",
            "AI-powered illustration prompts",
            "KDP-ready PDF export",
            "Priority support",
            "Cancel anytime",
          ].map((feature, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
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
                if (e.key === "Enter") handleEmailCheckout();
              }}
              className="subscribe-input"
              disabled={isCreatingSession}
              data-ocid="subscribe.email_input"
            />
          </div>

          <button
            type="button"
            className="subscribe-cta"
            onClick={handleEmailCheckout}
            disabled={isCreatingSession || !email.trim()}
            data-ocid="subscribe.submit_button"
          >
            {isCreatingSession ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Starting checkout...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Subscribe Now — $19.99/book
              </>
            )}
          </button>

          {isAuthenticated && userPrincipal && (
            <button
              type="button"
              className="subscribe-cta"
              style={{ marginTop: "0.5rem", background: "#5a9a60" }}
              onClick={handlePrincipalCheckout}
              disabled={isCreatingSession}
              data-ocid="subscribe.principal_checkout_button"
            >
              {isCreatingSession ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CreditCard size={18} />
              )}
              Subscribe with your Internet Identity
            </button>
          )}
        </div>

        <p className="subscribe-note">Secure checkout powered by Stripe</p>
      </div>

      {isAuthenticated && (
        <div className="subscribe-dev-section">
          <p className="subscribe-dev-label">⚙️ Dev mode only</p>
          <button
            type="button"
            className="subscribe-dev-btn"
            onClick={handleDevAdminGrant}
            // Disabled until actor is fully initialized — prevents calling
            // _devAdminGrant with an anonymous or partially-ready actor
            disabled={isClaimingAdmin || !actor || !isInitialized}
            data-ocid="subscribe.dev_admin_button"
          >
            {isClaimingAdmin ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Claiming...
              </>
            ) : !isInitialized ? (
              "Initializing..."
            ) : (
              "Dev: Claim Admin Access"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
