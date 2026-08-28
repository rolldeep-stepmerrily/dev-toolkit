'use client';

import { useMemo, useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type StatusCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

interface HttpStatus {
  code: number;
  name: string;
  category: StatusCategory;
  description: string;
}

const HTTP_STATUSES: HttpStatus[] = [
  {
    code: 100,
    name: 'Continue',
    category: '1xx',
    description: '요청의 일부를 받았으며 클라이언트가 나머지를 계속 보내도 좋음',
  },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: '서버가 요청에 따라 프로토콜을 전환함' },
  { code: 102, name: 'Processing', category: '1xx', description: '요청을 처리 중이나 아직 응답할 수 없음(WebDAV)' },
  { code: 103, name: 'Early Hints', category: '1xx', description: '최종 응답 전에 일부 헤더를 미리 전달' },

  { code: 200, name: 'OK', category: '2xx', description: '요청이 성공적으로 처리됨' },
  { code: 201, name: 'Created', category: '2xx', description: '요청이 성공했고 새 리소스가 생성됨' },
  { code: 202, name: 'Accepted', category: '2xx', description: '요청을 접수했으나 처리가 완료되지 않음' },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    category: '2xx',
    description: '원 서버가 아닌 다른 출처에서 가져온 응답',
  },
  { code: 204, name: 'No Content', category: '2xx', description: '요청은 성공했으나 반환할 콘텐츠가 없음' },
  { code: 205, name: 'Reset Content', category: '2xx', description: '요청 성공, 클라이언트에 화면 초기화를 지시' },
  { code: 206, name: 'Partial Content', category: '2xx', description: 'Range 헤더 요청에 대한 일부 콘텐츠만 반환' },

  { code: 300, name: 'Multiple Choices', category: '3xx', description: '요청에 대해 여러 응답 선택지가 있음' },
  { code: 301, name: 'Moved Permanently', category: '3xx', description: '리소스가 새 URL로 영구적으로 이동함' },
  { code: 302, name: 'Found', category: '3xx', description: '리소스가 일시적으로 다른 URL에 있음' },
  { code: 303, name: 'See Other', category: '3xx', description: 'GET으로 다른 URL을 조회하라는 응답' },
  { code: 304, name: 'Not Modified', category: '3xx', description: '캐시된 리소스가 아직 유효함(변경 없음)' },
  {
    code: 307,
    name: 'Temporary Redirect',
    category: '3xx',
    description: '메서드를 유지한 채 임시로 다른 URL로 리다이렉트',
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    category: '3xx',
    description: '메서드를 유지한 채 영구적으로 다른 URL로 리다이렉트',
  },

  { code: 400, name: 'Bad Request', category: '4xx', description: '요청 구문 또는 파라미터가 잘못됨' },
  { code: 401, name: 'Unauthorized', category: '4xx', description: '인증이 필요하거나 인증에 실패함' },
  { code: 402, name: 'Payment Required', category: '4xx', description: '결제가 필요함(예약된 상태 코드)' },
  { code: 403, name: 'Forbidden', category: '4xx', description: '인증되었으나 접근 권한이 없음' },
  { code: 404, name: 'Not Found', category: '4xx', description: '요청한 리소스를 찾을 수 없음' },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: '해당 리소스에 허용되지 않은 HTTP 메서드' },
  { code: 406, name: 'Not Acceptable', category: '4xx', description: '요청의 Accept 헤더를 만족하는 콘텐츠가 없음' },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    category: '4xx',
    description: '프록시 서버에 대한 인증이 필요함',
  },
  { code: 408, name: 'Request Timeout', category: '4xx', description: '서버가 요청을 기다리다가 시간 초과됨' },
  { code: 409, name: 'Conflict', category: '4xx', description: '현재 리소스 상태와 요청이 충돌함' },
  { code: 410, name: 'Gone', category: '4xx', description: '리소스가 영구적으로 삭제되어 더 이상 없음' },
  { code: 411, name: 'Length Required', category: '4xx', description: 'Content-Length 헤더가 필요함' },
  { code: 412, name: 'Precondition Failed', category: '4xx', description: '요청 헤더의 조건을 서버가 만족하지 않음' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: '요청 본문이 서버가 허용하는 크기를 초과함' },
  { code: 414, name: 'URI Too Long', category: '4xx', description: '요청 URI가 서버가 허용하는 길이를 초과함' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: '서버가 지원하지 않는 미디어 타입' },
  { code: 416, name: 'Range Not Satisfiable', category: '4xx', description: 'Range 헤더가 리소스 범위를 벗어남' },
  { code: 417, name: 'Expectation Failed', category: '4xx', description: 'Expect 헤더의 조건을 만족할 수 없음' },
  {
    code: 418,
    name: "I'm a Teapot",
    category: '4xx',
    description: '서버가 커피포트라 요청한 커피를 만들 수 없음(만우절 RFC)',
  },
  {
    code: 422,
    name: 'Unprocessable Entity',
    category: '4xx',
    description: '요청 구문은 올바르나 의미상 처리할 수 없음',
  },
  { code: 423, name: 'Locked', category: '4xx', description: '접근하려는 리소스가 잠겨 있음(WebDAV)' },
  { code: 425, name: 'Too Early', category: '4xx', description: '재전송된 요청이 처리되는 중 리플레이 위험이 있음' },
  { code: 426, name: 'Upgrade Required', category: '4xx', description: '클라이언트가 다른 프로토콜로 전환해야 함' },
  { code: 428, name: 'Precondition Required', category: '4xx', description: '조건부 요청이 필요함' },
  {
    code: 429,
    name: 'Too Many Requests',
    category: '4xx',
    description: '일정 시간 동안 너무 많은 요청을 보냄(rate limit)',
  },
  { code: 431, name: 'Request Header Fields Too Large', category: '4xx', description: '요청 헤더 필드가 너무 큼' },
  { code: 451, name: 'Unavailable For Legal Reasons', category: '4xx', description: '법적인 이유로 접근이 제한됨' },

  {
    code: 500,
    name: 'Internal Server Error',
    category: '5xx',
    description: '서버 내부에서 처리 중 예상치 못한 오류 발생',
  },
  { code: 501, name: 'Not Implemented', category: '5xx', description: '서버가 요청 메서드를 지원하지 않음' },
  {
    code: 502,
    name: 'Bad Gateway',
    category: '5xx',
    description: '게이트웨이/프록시가 상위 서버로부터 잘못된 응답을 받음',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    category: '5xx',
    description: '서버가 일시적으로 요청을 처리할 수 없음(과부하/점검)',
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    category: '5xx',
    description: '게이트웨이/프록시가 상위 서버 응답을 시간 내 받지 못함',
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    category: '5xx',
    description: '서버가 요청의 HTTP 버전을 지원하지 않음',
  },
  { code: 507, name: 'Insufficient Storage', category: '5xx', description: '요청을 완료할 저장 공간이 부족함(WebDAV)' },
  { code: 508, name: 'Loop Detected', category: '5xx', description: '요청 처리 중 무한 루프가 감지됨(WebDAV)' },
  {
    code: 511,
    name: 'Network Authentication Required',
    category: '5xx',
    description: '네트워크 접근을 위한 인증이 필요함',
  },
];

const CATEGORY_LABEL: Record<StatusCategory, string> = {
  '1xx': '1xx 정보',
  '2xx': '2xx 성공',
  '3xx': '3xx 리다이렉션',
  '4xx': '4xx 클라이언트 오류',
  '5xx': '5xx 서버 오류',
};

const CATEGORY_BADGE_CLASS: Record<StatusCategory, string> = {
  '1xx': 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  '2xx': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  '3xx': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  '4xx': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  '5xx': 'bg-red-500/15 text-red-600 dark:text-red-400',
};

type CategoryFilter = 'all' | StatusCategory;

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '1xx', label: '1xx' },
  { value: '2xx', label: '2xx' },
  { value: '3xx', label: '3xx' },
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' },
];

export default function HttpStatusPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return HTTP_STATUSES.filter((status) => {
      if (category !== 'all' && status.category !== category) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        String(status.code).includes(q) ||
        status.name.toLowerCase().includes(q) ||
        status.description.toLowerCase().includes(q)
      );
    });
  }, [keyword, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">HTTP 상태 코드</h1>
        <p className="text-sm text-muted-foreground">HTTP 응답 상태 코드와 의미를 검색합니다.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="코드 또는 이름으로 검색 (예: 404, Not Found)"
          />

          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as CategoryFilter)}
          >
            <TabsList className="flex-wrap max-md:h-auto">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">일치하는 상태 코드가 없습니다.</p>
        )}

        {filtered.map((status) => (
          <Card key={status.code}>
            <CardContent className="flex items-center gap-4 py-3 max-md:flex-col max-md:items-start max-md:gap-2">
              <div className="flex w-20 shrink-0 items-center gap-2 max-md:w-full max-md:justify-between">
                <span className="font-mono text-lg font-bold">{status.code}</span>
                <CopyButton value={String(status.code)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{status.name}</span>
                  <Badge className={CATEGORY_BADGE_CLASS[status.category]}>{CATEGORY_LABEL[status.category]}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{status.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
