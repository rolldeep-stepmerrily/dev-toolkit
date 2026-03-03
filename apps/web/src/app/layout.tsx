import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dev Toolkit',
  description: '개발자를 위한 도구 모음',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
