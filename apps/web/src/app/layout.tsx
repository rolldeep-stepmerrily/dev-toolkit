import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/auth-context';
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

export const viewport: Viewport = {
  viewportFit: 'cover',
};

const RootLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <LayoutShell>{children}</LayoutShell>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
