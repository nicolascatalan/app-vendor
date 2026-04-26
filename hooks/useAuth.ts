import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const ML_APP_ID = Constants.expoConfig?.extra?.ML_APP_ID ?? '';
const ML_APP_SECRET = Constants.expoConfig?.extra?.ML_APP_SECRET ?? '';
const ML_REDIRECT_URI = Constants.expoConfig?.extra?.ML_REDIRECT_URI ?? '';
const ML_SCOPES_RAW = Constants.expoConfig?.extra?.ML_SCOPES ?? 'read write';
const ML_USE_PKCE = String(Constants.expoConfig?.extra?.ML_USE_PKCE ?? 'false').toLowerCase() === 'true';
const ML_AUTH_URL = 'https://auth.mercadolibre.cl/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

// Fuera del hook para evitar recreación en cada render
const DISCOVERY = {
  authorizationEndpoint: ML_AUTH_URL,
  tokenEndpoint: ML_TOKEN_URL,
};
const ML_SCOPES = String(ML_SCOPES_RAW)
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const SECURE_KEYS = {
  ACCESS_TOKEN: 'ml_access_token',
  REFRESH_TOKEN: 'ml_refresh_token',
  USER_ID: 'ml_user_id',
  NICKNAME: 'ml_nickname',
  EMAIL: 'ml_email',
};

export interface MLUser {
  id: string;
  nickname: string;
  email: string;
}

interface AuthContextValue {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  user: MLUser | null;
  loading: boolean;
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useProvideAuth(): AuthContextValue {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<MLUser | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = ML_REDIRECT_URI;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ML_APP_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: ML_USE_PKCE,
      scopes: ML_SCOPES,
    },
    DISCOVERY
  );

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        if (token) {
          const userId = await SecureStore.getItemAsync(SECURE_KEYS.USER_ID);
          const nickname = await SecureStore.getItemAsync(SECURE_KEYS.NICKNAME);
          const email = await SecureStore.getItemAsync(SECURE_KEYS.EMAIL);
          if (userId && nickname) {
            setUser({ id: userId, nickname, email: email ?? '' });
            setIsAuthenticated(true);
          }
        }
      } catch (e) {
        console.warn('[useAuth] SecureStore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }

    if (response?.type === 'error' && __DEV__) {
      console.error('[useAuth] OAuth error response:', {
        error: response.error,
        params: response.params,
        url: response.url,
      });
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_APP_ID,
        ...(ML_APP_SECRET ? { client_secret: ML_APP_SECRET } : {}),
        code,
        redirect_uri: redirectUri,
        code_verifier: request?.codeVerifier ?? '',
      });

      const res = await fetch(ML_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) throw new Error('Token exchange failed');

      const data = await res.json();
      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, data.access_token);
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, data.refresh_token);

      // Fetch user profile
      const userRes = await fetch(`https://api.mercadolibre.com/users/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();

      await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, String(userData.id));
      await SecureStore.setItemAsync(SECURE_KEYS.NICKNAME, userData.nickname);
      await SecureStore.setItemAsync(SECURE_KEYS.EMAIL, userData.email ?? '');

      setUser({ id: String(userData.id), nickname: userData.nickname, email: userData.email });
      setIsAuthenticated(true);
    } catch (e) {
      if (__DEV__) {
        console.error('Auth error:', e);
      }
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ML_APP_ID,
      ...(ML_APP_SECRET ? { client_secret: ML_APP_SECRET } : {}),
      refresh_token: refreshToken,
    });

    const res = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, data.access_token);
    if (data.refresh_token) {
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, data.refresh_token);
    }
    return data.access_token;
  };

  const login = useCallback(async () => {
    if (!ML_APP_ID) {
      throw new Error('ML_APP_ID no configurado');
    }

    if (!redirectUri || !redirectUri.startsWith('https://')) {
      throw new Error('MercadoLibre requiere ML_REDIRECT_URI con https://');
    }

    if (!request) {
      throw new Error('OAuth request aún no está lista');
    }

    if (__DEV__) {
      console.log('[useAuth] Authorization URL →', request.url);
    }

    await promptAsync();
  }, [promptAsync, redirectUri, request]);

  const logout = useCallback(async () => {
    await Promise.all(Object.values(SECURE_KEYS).map((k) => SecureStore.deleteItemAsync(k)));
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { login, logout, isAuthenticated, user, loading, getAccessToken, refreshAccessToken };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();

  return createElement(AuthContext.Provider, { value: auth }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
