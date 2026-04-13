/**
 * Subscription verification utility
 * Safely checks subscription status without modifying existing application logic
 */

export interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  isActive: boolean;
  startDate?: number;
  endDate?: number;
}

const BILLING_SERVER_URL =
  import.meta.env.VITE_BILLING_SERVER_URL || "http://localhost:4002";

// ─── TEST MODE BYPASS ────────────────────────────────────────────────────────
// Activates when: VITE_TEST_MODE=true, OR billing server is unset / localhost.
// To disable for production: set VITE_BILLING_SERVER_URL to a real server URL
// and ensure VITE_TEST_MODE is not "true".
const _isLocalhost =
  !import.meta.env.VITE_BILLING_SERVER_URL ||
  BILLING_SERVER_URL.includes("localhost") ||
  BILLING_SERVER_URL.includes("127.0.0.1");
const TEST_MODE = import.meta.env.VITE_TEST_MODE === "true" || _isLocalhost;

const MOCK_ACTIVE: SubscriptionStatus = {
  hasSubscription: true,
  status: "active",
  isActive: true,
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check subscription status for a user principal
 */
export async function checkSubscription(
  userPrincipal: string,
): Promise<SubscriptionStatus> {
  if (TEST_MODE) {
    console.warn(
      "[TEST MODE] Stripe subscription bypass active — returning mock active subscription for principal:",
      userPrincipal,
    );
    return MOCK_ACTIVE;
  }
  try {
    const response = await fetch(
      `${BILLING_SERVER_URL}/api/check-subscription?userPrincipal=${encodeURIComponent(userPrincipal)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch {
    return { hasSubscription: false, status: null, isActive: false };
  }
}

/**
 * Create a Stripe checkout session (principal-based)
 */
export async function createCheckoutSession(
  userPrincipal: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const response = await fetch(
    `${BILLING_SERVER_URL}/api/create-checkout-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrincipal, successUrl, cancelUrl }),
    },
  );
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

/**
 * Create a Stripe checkout session using email (no account required)
 */
export async function createEmailCheckoutSession(
  email: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const response = await fetch(
    `${BILLING_SERVER_URL}/api/create-checkout-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, successUrl, cancelUrl }),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        `HTTP error! status: ${response.status}`,
    );
  }
  return response.json();
}

/**
 * Check subscription status by email
 */
export async function checkSubscriptionByEmail(
  email: string,
): Promise<SubscriptionStatus> {
  if (TEST_MODE) {
    console.warn(
      "[TEST MODE] Stripe subscription bypass active — returning mock active subscription for email:",
      email,
    );
    return MOCK_ACTIVE;
  }
  try {
    const response = await fetch(
      `${BILLING_SERVER_URL}/api/check-subscription-by-email?email=${encodeURIComponent(email)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch {
    return { hasSubscription: false, status: null, isActive: false };
  }
}
