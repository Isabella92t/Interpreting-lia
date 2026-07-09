import {
  DiscoveryDocument,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  makeRedirectUri,
  TokenResponse,
  useAuthRequest,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

// Required on web: closes the auth popup and delivers the result back to the app.
WebBrowser.maybeCompleteAuthSession();

const auth0Domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;

export const isAuth0Configured = Boolean(
  auth0Domain && auth0ClientId && !auth0Domain.includes('YOUR_') && !auth0ClientId.includes('YOUR_')
);

export type AuthUser = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth0 rejects a bare custom scheme ("interpretinglia://") as a callback URL,
// so native gets a path suffix. Web stays at the app origin (http://localhost:8081).
const redirectUri = makeRedirectUri(Platform.OS === 'web' ? {} : { path: 'callback' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [discovery, setDiscovery] = useState<DiscoveryDocument | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuth0Configured) return;
    let mounted = true;
    fetchDiscoveryAsync(`https://${auth0Domain}`)
      .then((doc) => {
        if (mounted) setDiscovery(doc);
      })
      .catch((e) => {
        if (mounted) setError(`Could not reach Auth0 (${String(e)})`);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: auth0ClientId ?? 'not-configured',
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    },
    discovery
  );

  useEffect(() => {
    if (!response || !request || !discovery) return;
    if (response.type === 'error') {
      setError(response.error?.message ?? 'Authentication failed');
      return;
    }
    if (response.type !== 'success') return;

    let mounted = true;
    setIsExchanging(true);
    setError(null);
    exchangeCodeAsync(
      {
        clientId: auth0ClientId!,
        code: response.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery
    )
      .then((tokens: TokenResponse) =>
        fetch(discovery.userInfoEndpoint!, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }).then((res) => res.json())
      )
      .then((profile: AuthUser) => {
        if (mounted) setUser(profile);
      })
      .catch((e) => {
        if (mounted) setError(`Sign-in failed (${String(e)})`);
      })
      .finally(() => {
        if (mounted) setIsExchanging(false);
      });
    return () => {
      mounted = false;
    };
  }, [response, request, discovery]);

  const signIn = useCallback(async () => {
    setError(null);
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      // Loading while Auth0 metadata is being fetched or a code exchange is in flight.
      isLoading: (isAuth0Configured && !discovery && !error) || isExchanging,
      isConfigured: isAuth0Configured,
      error,
      signIn,
      signOut,
    }),
    [user, discovery, isExchanging, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}