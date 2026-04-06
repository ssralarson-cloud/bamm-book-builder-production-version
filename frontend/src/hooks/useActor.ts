/**
 * Base actor hook — creates a @dfinity/agent Actor for the BAM backend canister
 * using the current Internet Identity.
 *
 * This is the low-level hook. Prefer useActorExtended (which adds isInitialized,
 * isAuthenticated) in most components.
 */

import { useState, useEffect } from 'react';
import { HttpAgent, Actor } from '@icp-sdk/core/agent';
import { useInternetIdentity } from './useInternetIdentity';
import { idlFactory, type backendInterface } from '../backend';

export interface UseActorBaseReturn {
  actor: backendInterface | null;
  isFetching: boolean;
}

export function useActor(): UseActorBaseReturn {
  const { identity, isInitializing } = useInternetIdentity();
  const [actor, setActor] = useState<backendInterface | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // Wait until the II client has finished initializing
    if (isInitializing) return;

    const canisterId = import.meta.env.VITE_CANISTER_ID as string | undefined;
    const host = (import.meta.env.VITE_IC_HOST as string | undefined) || 'https://ic0.app';

    if (!canisterId) {
      console.warn('[useActor] VITE_CANISTER_ID is not set — actor will be null');
      setActor(null);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function buildActor() {
      setIsFetching(true);
      try {
        const agent = await HttpAgent.create({
          host,
          identity: identity ?? undefined,
        });

        // Fetch root key only for local replica — NEVER in production
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          await agent.fetchRootKey().catch(console.error);
        }

        if (cancelled) return;

        // Cast needed: our idlFactory signature uses @icp-sdk/core/candid IDL
        // which has a slightly different type than InterfaceFactory from the agent
        const newActor = Actor.createActor<backendInterface>(idlFactory as any, {
          agent,
          canisterId: canisterId!,
        });

        setActor(newActor);
      } catch (err) {
        console.error('[useActor] Failed to build actor:', err);
        setActor(null);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    buildActor();
    return () => { cancelled = true; };
  }, [identity, isInitializing]);

  return { actor, isFetching };
}
