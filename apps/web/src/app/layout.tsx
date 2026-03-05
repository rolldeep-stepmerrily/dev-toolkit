import type { Metadata } from 'next';
import { LayoutShell } from '@/components/layout/layout-shell';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Dev Toolkit',
    default: 'Dev Toolkit',
  },
  description: '개발자를 위한 도구 모음',
};

const RootLayout = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>
            <LayoutShell>{children}</LayoutShell>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
