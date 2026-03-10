'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

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

interface UserDataContextValue {
  profile: Profile | null;
  bookmarks: string[];
  isLoading: boolean;
  toggleBookmark: (toolId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

export const UserDataProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const { user, getValidToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ref로 최신 getValidToken 유지 (fetchUserData를 안정적으로 유지하기 위함)
  const getValidTokenRef = useRef(getValidToken);
  getValidTokenRef.current = getValidToken;

  const fetchUserData = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const token = await getValidTokenRef.current();

      if (!token) {
        return;
      }

      const [profileData, bookmarksData] = await Promise.all([
        apiFetch<Profile>('/users/me', { token }),
        apiFetch<string[]>('/users/me/bookmarks', { token }),
      ]);

      setProfile(profileData);
      setBookmarks(bookmarksData);
    } catch {
      // 인증 실패 등의 에러는 무시
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setBookmarks([]);
    }
  }, [user, fetchUserData]);

  const toggleBookmark = useCallback(
    async (toolId: string): Promise<void> => {
      const token = await getValidToken();

      if (!token) {
        return;
      }

      const updated = await apiFetch<string[]>(`/users/me/bookmarks/${toolId}`, {
        method: 'POST',
        token,
      });

      setBookmarks(updated);
    },
    [getValidToken],
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    const token = await getValidToken();

    if (!token) {
      return;
    }

    const updated = await apiFetch<Profile>('/users/me', { token });
    setProfile(updated);
  }, [getValidToken]);

  return (
    <UserDataContext.Provider value={{ profile, bookmarks, isLoading, toggleBookmark, refreshProfile }}>
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
