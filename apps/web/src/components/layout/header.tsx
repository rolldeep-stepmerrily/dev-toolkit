'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

/**
 * 글로벌 헤더 컴포넌트
 * 모바일에서 햄버거 메뉴 버튼과 앱 타이틀을 표시
 *
 * @param {HeaderProps} props
 * @returns {JSX.Element}
 */
export const Header = ({ onMenuClick }: HeaderProps): React.JSX.Element => {
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
      <ThemeToggle />
    </header>
  );
};
