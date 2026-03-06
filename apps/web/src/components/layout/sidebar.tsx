'use client';

import React, { useEffect, useRef } from 'react';
import { Binary, Clock, Code2, Globe, Key, Lock, Network, Regex, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'jwt', name: 'JWT', description: '생성/검증기', href: '/tools/jwt', icon: Key },
  { id: 'bcrypt', name: 'Bcrypt', description: '해시 생성/검증', href: '/tools/bcrypt', icon: Lock },
  { id: 'json', name: 'JSON', description: '포맷터', href: '/tools/json', icon: Code2 },
  { id: 'base64', name: 'Base64', description: '인코더/디코더', href: '/tools/base64', icon: Binary },
  { id: 'url', name: 'URL', description: '인코더/디코더', href: '/tools/url', icon: Globe },
  { id: 'regex', name: 'Regex', description: '정규식 테스터', href: '/tools/regex', icon: Regex },
  { id: 'ip', name: 'IP', description: 'IP 주소 확인기', href: '/tools/ip', icon: Network },
  { id: 'timestamp', name: 'Timestamp', description: '타임스탬프 변환', href: '/tools/timestamp', icon: Clock },
];

const toolById = Object.fromEntries(tools.map((t) => [t.id, t]));

interface SidebarProps {
  onClose?: () => void;
}

interface ToolItemProps {
  tool: (typeof tools)[number];
  isActive: boolean;
  isBookmarked: boolean;
  isLoggedIn: boolean;
  onBookmark: (toolId: string) => void;
  onClose?: () => void;
}

/**
 * 사이드바 개별 도구 아이템 컴포넌트
 * 로그인 시 hover 상태에서 북마크 토글 버튼 표시
 *
 * @param {ToolItemProps} props
 * @returns {JSX.Element}
 */
const ToolItem = ({ tool, isActive, isBookmarked, isLoggedIn, onBookmark, onClose }: ToolItemProps): React.JSX.Element => {
  const Icon = tool.icon;

  return (
    <li key={tool.href} className="group relative">
      <Link
        href={tool.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors pr-8',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <div className="font-medium">{tool.name}</div>
          <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
        </div>
      </Link>

      {isLoggedIn && (
        <button
          type="button"
          onClick={() => onBookmark(tool.id)}
          aria-label={isBookmarked ? '북마크 제거' : '북마크 추가'}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 transition-opacity',
            isBookmarked
              ? 'opacity-100 text-yellow-500 hover:text-yellow-600'
              : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground',
          )}
        >
          <Star className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')} />
        </button>
      )}
    </li>
  );
};

/**
 * 사이드바 네비게이션 컴포넌트
 * 로그인 시 북마크/히스토리 섹션 표시, 도구별 북마크 토글 제공
 *
 * @param {SidebarProps} props
 * @returns {JSX.Element}
 */
export const Sidebar = ({ onClose }: SidebarProps): React.JSX.Element => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { bookmarks, history, toggleBookmark, recordHistory } = useUserData();

  const recordedRef = useRef<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/tools\/([^/]+)/);
    const toolId = match?.[1];

    if (toolId && user && recordedRef.current !== pathname) {
      recordedRef.current = pathname;
      recordHistory(toolId);
    }
  }, [pathname, user, recordHistory]);

  const bookmarkedTools = bookmarks.map((id) => toolById[id]).filter(Boolean);
  const recentTools = history.map((h) => toolById[h.toolId]).filter(Boolean).slice(0, 5);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="font-bold text-sidebar-foreground">Dev Toolkit</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* 즐겨찾기 */}
        {user && bookmarkedTools.length > 0 && (
          <div>
            <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">즐겨찾기</p>
            <ul className="space-y-0.5">
              {bookmarkedTools.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  isActive={pathname === tool.href}
                  isBookmarked={true}
                  isLoggedIn={true}
                  onBookmark={toggleBookmark}
                  onClose={onClose}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 전체 도구 */}
        <div>
          <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tools</p>
          <ul className="space-y-0.5">
            {tools.map((tool) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                isActive={pathname === tool.href}
                isBookmarked={bookmarks.includes(tool.id)}
                isLoggedIn={!!user}
                onBookmark={toggleBookmark}
                onClose={onClose}
              />
            ))}
          </ul>
        </div>

        {/* 최근 사용 */}
        {user && recentTools.length > 0 && (
          <div>
            <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">최근 사용</p>
            <ul className="space-y-0.5">
              {recentTools.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  isActive={pathname === tool.href}
                  isBookmarked={bookmarks.includes(tool.id)}
                  isLoggedIn={true}
                  onBookmark={toggleBookmark}
                  onClose={onClose}
                />
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
};
