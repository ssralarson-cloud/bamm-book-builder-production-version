import { UseActorReturn } from '../hooks/useActorExtended';

/**
 * Prevents all anonymous calls by checking actor initialization and authentication status.
 * Throws descriptive errors if conditions are not met.
 */
export function requireActor(actorState: UseActorReturn, operation: string): void {
    if (!actorState.isInitialized) {
        throw new Error(`${operation}: Actor not initialized. Please wait for the session to be ready.`);
    }

    if (!actorState.actor) {
        throw new Error(`${operation}: Actor not available. Please refresh the page.`);
    }

    if (!actorState.isAuthenticated) {
        throw new Error(`${operation}: Authentication required. Please log in with Internet Identity.`);
    }
}
