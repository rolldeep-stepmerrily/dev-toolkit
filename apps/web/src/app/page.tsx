import { Binary, Clock, Code2, Globe, Key, Lock, Network, Regex } from 'lucide-react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const tools = [
  {
    name: 'JWT',
    description: 'JWT 토큰을 생성하고 페이로드를 디코딩하여 검증합니다.',
    href: '/tools/jwt',
    icon: Key,
  },
  {
    name: 'Bcrypt',
    description: '비밀번호를 안전하게 해시하고 검증합니다.',
    href: '/tools/bcrypt',
    icon: Lock,
  },
  {
    name: 'JSON 포맷터',
    description: 'JSON 직렬화/역직렬화, 포맷팅, YAML 변환을 지원합니다.',
    href: '/tools/json',
    icon: Code2,
  },
  {
    name: 'Base64',
    description: '텍스트와 파일을 Base64로 인코딩/디코딩합니다.',
    href: '/tools/base64',
    icon: Binary,
  },
  {
    name: 'URL',
    description: 'URL을 인코딩/디코딩하고 쿼리 파라미터를 분석합니다.',
    href: '/tools/url',
    icon: Globe,
  },
  {
    name: '정규식 테스터',
    description: '정규식 패턴을 작성하고 실시간으로 매칭 결과를 확인합니다.',
    href: '/tools/regex',
    icon: Regex,
  },
  {
    name: 'IP 주소',
    description: '현재 IP를 확인하고 IPv4/IPv6 변환, CIDR 계산을 합니다.',
    href: '/tools/ip',
    icon: Network,
  },
  {
    name: 'Timestamp',
    description: 'Unix 타임스탬프와 날짜/시간을 상호 변환합니다.',
    href: '/tools/timestamp',
    icon: Clock,
  },
];

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">개발자 도구 모음</h1>
        <p className="mt-1 text-muted-foreground">자주 쓰는 개발 유틸리티를 한 곳에서.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
            >
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
