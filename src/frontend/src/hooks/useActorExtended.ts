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
 */
export function useActor(): UseActorReturn {
  const baseActor = useActorBase();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isIdentityReady = !isInitializing;
  const isInitialized =
    isIdentityReady && !!baseActor.actor && !baseActor.isFetching;

  return {
    actor: baseActor.actor,
    isFetching: baseActor.isFetching,
    isInitialized,
    isAuthenticated,
  };
}
