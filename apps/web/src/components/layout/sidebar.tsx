'use client';

import { Binary, Clock, Code2, Globe, Key, Lock, Network, Regex } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tools = [
  { name: 'JWT', description: '생성/검증기', href: '/tools/jwt', icon: Key },
  { name: 'Bcrypt', description: '해시 생성/검증', href: '/tools/bcrypt', icon: Lock },
  { name: 'JSON', description: '포맷터', href: '/tools/json', icon: Code2 },
  { name: 'Base64', description: '인코더/디코더', href: '/tools/base64', icon: Binary },
  { name: 'URL', description: '인코더/디코더', href: '/tools/url', icon: Globe },
  { name: 'Regex', description: '정규식 테스터', href: '/tools/regex', icon: Regex },
  { name: 'IP', description: 'IP 주소 확인기', href: '/tools/ip', icon: Network },
  { name: 'Timestamp', description: '타임스탬프 변환', href: '/tools/timestamp', icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <span className="font-bold text-sidebar-foreground">Dev Toolkit</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <p className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tools</p>
        <ul className="space-y-0.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = pathname === tool.href;
            return (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
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
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
