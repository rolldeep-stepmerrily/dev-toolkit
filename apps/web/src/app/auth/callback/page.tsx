'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';

const AuthCallbackPage = (): React.JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      router.replace('/');

      return;
    }

    router.replace('/login');
  }, [searchParams, setTokens, router]);

  return (
    <div className="flex min-h-full items-center justify-center">
      <p className="text-muted-foreground">로그인 처리 중...</p>
    </div>
  );
};

export default AuthCallbackPage;
