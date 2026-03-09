'use client';

import { LogOut, Menu, Settings, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps): React.JSX.Element => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { profile } = useUserData();

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center border-b bg-background px-4">
      <button
        type="button"
        className="mr-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="font-bold md:hidden">Dev Toolkit</span>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {!isLoading &&
          (user ? (
            <div className="flex items-center gap-2">
              {profile?.avatarUrl && (
                <div className="relative hidden h-7 w-7 shrink-0 overflow-hidden rounded-full sm:block">
                  <Image
                    src={profile.avatarUrl}
                    alt="avatar"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                asChild
                aria-label="프로필 설정"
              >
                <Link href="/profile">
                  <Settings />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                aria-label="로그아웃"
              >
                <LogOut />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/login">
                <User className="mr-1.5 size-4" />
                로그인
              </Link>
            </Button>
          ))}
      </div>
    </header>
  );
};
