'use client';

import React, { useCallback, useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface LayoutShellProps {
  children: React.ReactNode;
}

/**
 * 전체 레이아웃 쉘 컴포넌트
 * 모바일 사이드바 오버레이 상태를 관리하며 Header, Sidebar, 메인 컨텐츠를 조합
 *
 * @param {LayoutShellProps} props
 * @returns {JSX.Element}
 */
export const LayoutShell = ({ children }: LayoutShellProps): React.JSX.Element => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClose = useCallback(() => setMobileOpen(false), []);
  const handleMenuOpen = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* 모바일 백드롭 */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* 사이드바: 모바일은 슬라이드 오버레이, 데스크탑은 고정 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:z-auto md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar onClose={handleClose} />
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={handleMenuOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        <footer
          className="border-t px-4 pt-3 text-center text-xs text-muted-foreground"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          © {new Date().getFullYear()}{' '}
          <a
            href="https://github.com/rolldeep-stepmerrily"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            rolldeep-stepmerrily
          </a>
          . All rights reserved.
        </footer>
      </div>
    </div>
  );
};
