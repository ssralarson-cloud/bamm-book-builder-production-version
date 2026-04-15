import { useRef } from "react";
import type { backendInterface } from "../backend";
import { useActor as useActorBase } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export interface UseActorReturn {
  actor: backendInterface | null;
  isFetching: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
}

/**
 * Extended useActor hook that adds isInitialized and isAuthenticated flags
 * for better actor state management and defensive checks.
 *
 * KEY RACE CONDITION FIX:
 * isInitialized is "sticky" — once the actor has been initialized, it stays
 * true even while isFetching is temporarily true during re-renders or
 * navigation. This prevents queries from being disabled and re-fired with
 * a stale anonymous actor on every page navigation.
 *
 * The flag is only reset when the identity changes (e.g., user logs out).
 */
export function useActor(): UseActorReturn {
  const baseActor = useActorBase();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isIdentityReady = !isInitializing;

  // Track the previously-seen identity principal so we can detect changes
  const lastPrincipalRef = useRef<string | null>(null);
  // Sticky initialized flag — stays true once set, resets on identity change
  const stickyInitializedRef = useRef(false);

  const currentPrincipal = identity ? identity.getPrincipal().toString() : null;

  // Reset sticky flag if the identity changed (logout / new login)
  if (currentPrincipal !== lastPrincipalRef.current) {
    lastPrincipalRef.current = currentPrincipal;
    stickyInitializedRef.current = false;
  }

  // Once truly initialized, set sticky flag and keep it
  const trulyInitialized =
    isIdentityReady && !!baseActor.actor && !baseActor.isFetching;
  if (trulyInitialized) {
    stickyInitializedRef.current = true;
  }

  // isInitialized is sticky: stays true after first successful init
  // as long as we still have an actor (guards against actor being null after logout)
  const isInitialized =
    stickyInitializedRef.current && !!baseActor.actor && isIdentityReady;

  return {
    actor: baseActor.actor,
    isFetching: baseActor.isFetching,
    isInitialized,
    isAuthenticated,
  };
}
