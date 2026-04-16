import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const ML_APP_ID = Constants.expoConfig?.extra?.ML_APP_ID ?? '';
const ML_APP_SECRET = Constants.expoConfig?.extra?.ML_APP_SECRET ?? '';
const ML_AUTH_URL = 'https://auth.mercadolibre.cl/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

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

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<MLUser | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'propublish' });

  const discovery = {
    authorizationEndpoint: ML_AUTH_URL,
    tokenEndpoint: ML_TOKEN_URL,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ML_APP_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ['read', 'write', 'offline_access'],
    },
    discovery
  );

  useEffect(() => {
    (async () => {
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
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
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
      console.error('Auth error:', e);
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
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await Promise.all(Object.values(SECURE_KEYS).map((k) => SecureStore.deleteItemAsync(k)));
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { login, logout, isAuthenticated, user, loading, getAccessToken, refreshAccessToken };
}
