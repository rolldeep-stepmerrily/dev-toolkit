'use client';

import { decodeJwt } from 'jose';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * JWT 액세스 토큰을 디코딩하여 사용자 정보를 반환
 *
 * @param {string} token JWT 액세스 토큰
 * @returns {AuthUser | null} 디코딩된 사용자 정보 또는 null
 */
const decodeUser = (token: string): AuthUser | null => {
  try {
    const payload = decodeJwt(token);

    return { id: Number(payload.sub), email: payload.email as string };
  } catch {
    return null;
  }
};

/**
 * 액세스 토큰이 만료됐는지 확인 (30초 버퍼 포함)
 *
 * @param {string} token JWT 액세스 토큰
 * @returns {boolean} 만료 여부
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJwt(token);
    const exp = payload.exp as number | undefined;

    return !exp || exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (stored) {
      setAccessToken(stored);
      setUser(decodeUser(stored));
    }

    setIsLoading(false);
  }, []);

  const setTokens = useCallback((access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setAccessToken(access);
    setUser(decodeUser(access));
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (token && refreshToken) {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
          token,
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // 서버 오류여도 클라이언트 상태는 초기화
      }
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  /**
   * 유효한 액세스 토큰을 반환. 만료된 경우 리프레시 토큰으로 자동 갱신.
   * 갱신 실패 시 로그아웃 처리 후 null 반환.
   *
   * @returns {Promise<string | null>} 유효한 액세스 토큰 또는 null
   */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!currentToken) {
      return null;
    }

    if (!isTokenExpired(currentToken)) {
      return currentToken;
    }

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedRefreshToken) {
      await logout();
      return null;
    }

    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        token: storedRefreshToken,
      });

      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      await logout();
      return null;
    }
  }, [logout, setTokens]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
    },
    [setTokens],
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, setTokens, getValidToken }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 인증 컨텍스트를 반환하는 커스텀 훅
 *
 * @returns {AuthContextValue} 인증 컨텍스트 값
 * @throws {Error} AuthProvider 외부에서 사용하는 경우
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
};
