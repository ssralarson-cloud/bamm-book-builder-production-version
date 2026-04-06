/**
 * Internet Identity authentication hook + provider.
 *
 * Usage:
 *   <InternetIdentityProvider>...</InternetIdentityProvider>
 *   const { identity, login, logout, clear, loginStatus, isInitializing } = useInternetIdentity();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthClient } from '@icp-sdk/auth/client';
import type { Identity } from '@icp-sdk/core/agent';

export type LoginStatus =
  | 'initializing'
  | 'anonymous'
  | 'logging-in'
  | 'authenticated'
  | 'error';

interface InternetIdentityContextValue {
  identity: Identity | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  /** Alias for logout — clears the session */
  clear: () => Promise<void>;
  loginStatus: LoginStatus;
  isInitializing: boolean;
}

const InternetIdentityContext = createContext<InternetIdentityContextValue>({
  identity: null,
  login: async () => {},
  logout: async () => {},
  clear: async () => {},
  loginStatus: 'initializing',
  isInitializing: true,
});

const II_URL =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_II_URL
    ? (import.meta as any).env.VITE_II_URL
    : 'https://identity.ic0.app';

export function InternetIdentityProvider({ children }: { children: ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('initializing');

  useEffect(() => {
    let cancelled = false;
    AuthClient.create().then((client) => {
      if (cancelled) return;
      setAuthClient(client);
      const id = client.getIdentity();
      if (id && !id.getPrincipal().isAnonymous()) {
        setIdentity(id);
        setLoginStatus('authenticated');
      } else {
        setIdentity(null);
        setLoginStatus('anonymous');
      }
    }).catch((err) => {
      if (cancelled) return;
      console.error('[useInternetIdentity] AuthClient.create failed:', err);
      setLoginStatus('error');
    });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!authClient) {
        reject(new Error('AuthClient not ready'));
        return;
      }
      setLoginStatus('logging-in');
      authClient.login({
        identityProvider: II_URL,
        onSuccess: () => {
          const id = authClient.getIdentity();
          setIdentity(id);
          setLoginStatus('authenticated');
          resolve();
        },
        onError: (err) => {
          console.error('[useInternetIdentity] Login failed:', err);
          setLoginStatus('error');
          reject(new Error(err || 'Login failed'));
        },
      });
    });
  }, [authClient]);

  const logout = useCallback(async () => {
    if (!authClient) return;
    await authClient.logout();
    setIdentity(null);
    setLoginStatus('anonymous');
  }, [authClient]);

  // `clear` is an alias for `logout` — Header.tsx calls it by this name
  const clear = logout;

  const isInitializing = loginStatus === 'initializing';

  return (
    <InternetIdentityContext.Provider
      value={{ identity, login, logout, clear, loginStatus, isInitializing }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
}

export function useInternetIdentity(): InternetIdentityContextValue {
  return useContext(InternetIdentityContext);
}
