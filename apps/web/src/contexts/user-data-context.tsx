'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { useAuth } from './auth-context';

interface Profile {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  createdAt: string;
}

interface HistoryItem {
  toolId: string;
  usedAt: string;
}

interface UserDataContextValue {
  profile: Profile | null;
  bookmarks: string[];
  history: HistoryItem[];
  isLoading: boolean;
  toggleBookmark: (toolId: string) => Promise<void>;
  recordHistory: (toolId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

export const UserDataProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = useCallback(async (token: string): Promise<void> => {
    setIsLoading(true);

    try {
      const [profileData, bookmarksData, historyData] = await Promise.all([
        apiFetch<Profile>('/users/me', { token }),
        apiFetch<string[]>('/users/me/bookmarks', { token }),
        apiFetch<HistoryItem[]>('/users/me/history', { token }),
      ]);

      setProfile(profileData);
      setBookmarks(bookmarksData);
      setHistory(historyData);
    } catch {
      // 인증 실패 등의 에러는 무시
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      fetchUserData(accessToken);
    } else {
      setProfile(null);
      setBookmarks([]);
      setHistory([]);
    }
  }, [user, accessToken, fetchUserData]);

  const toggleBookmark = useCallback(
    async (toolId: string): Promise<void> => {
      if (!accessToken) return;

      const updated = await apiFetch<string[]>(`/users/me/bookmarks/${toolId}`, {
        method: 'POST',
        token: accessToken,
      });

      setBookmarks(updated);
    },
    [accessToken],
  );

  const recordHistory = useCallback(
    async (toolId: string): Promise<void> => {
      if (!accessToken) return;

      try {
        await apiFetch(`/users/me/history/${toolId}`, {
          method: 'POST',
          token: accessToken,
        });

        setHistory((prev) => {
          const filtered = prev.filter((h) => h.toolId !== toolId);
          return [{ toolId, usedAt: new Date().toISOString() }, ...filtered].slice(0, 10);
        });
      } catch {
        // 히스토리 기록 실패는 무시
      }
    },
    [accessToken],
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!accessToken) return;

    const updated = await apiFetch<Profile>('/users/me', { token: accessToken });
    setProfile(updated);
  }, [accessToken]);

  return (
    <UserDataContext.Provider value={{ profile, bookmarks, history, isLoading, toggleBookmark, recordHistory, refreshProfile }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextValue => {
  const ctx = useContext(UserDataContext);

  if (!ctx) {
    throw new Error('useUserData must be used within UserDataProvider');
  }

  return ctx;
};
