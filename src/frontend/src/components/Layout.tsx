import { Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useActor } from "../hooks/useActorExtended";
import Footer from "./Footer";
import Header from "./Header";

/**
 * Layout wraps every page. It is the single place where initializeAccessControl
 * is called — exactly once — after the actor becomes ready.
 *
 * WHY HERE:
 *   - Layout mounts once and persists across all route changes.
 *   - Calling it per-page would race against navigation and cause multiple
 *     redundant calls or calls with a stale actor.
 *   - The effect is gated on isInitialized so it never fires with an
 *     anonymous principal.
 */
export default function Layout() {
  const { actor, isInitialized } = useActor();

  // Track whether we have already called initializeAccessControl for this
  // actor instance. Reset when actor reference changes (e.g., after logout).
  const initializedForActorRef = useRef<object | null>(null);

  useEffect(() => {
    // Only run once per actor instance, only when fully initialized
    if (!isInitialized || !actor || initializedForActorRef.current === actor) {
      return;
    }

    // Mark this actor instance as handled before the async call to prevent
    // duplicate calls from React Strict Mode double-invocation
    initializedForActorRef.current = actor;

    // Call initializeAccessControl if the method exists on the canister.
    // This guard handles version mismatches between frontend IDL and deployed
    // WASM — older canisters may not have the method.
    const actorAsAny = actor as unknown as Record<string, unknown>;
    if (typeof actorAsAny.initializeAccessControl === "function") {
      (async () => {
        try {
          console.log(
            "[Layout] Calling initializeAccessControl on actor ready",
          );
          await (actorAsAny.initializeAccessControl as () => Promise<void>)();
          console.log(
            "[Layout] initializeAccessControl completed successfully",
          );
        } catch (err) {
          // Non-fatal: the canister may reject if the caller is already
          // registered, or the method may not exist on the deployed version.
          // Either way the app should continue normally.
          console.warn(
            "[Layout] initializeAccessControl silently failed:",
            err,
          );
        }
      })();
    } else {
      console.log(
        "[Layout] initializeAccessControl not available on canister (older version) — skipping",
      );
    }
  }, [isInitialized, actor]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ isolation: "isolate" }}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
