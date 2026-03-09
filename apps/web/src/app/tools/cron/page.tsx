'use client';

import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';
import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const PRESETS = [
  { label: '매 분', value: '* * * * *' },
  { label: '매 시간', value: '0 * * * *' },
  { label: '매일 자정', value: '0 0 * * *' },
  { label: '매일 오전 9시', value: '0 9 * * *' },
  { label: '매주 월요일', value: '0 0 * * 1' },
  { label: '매월 1일', value: '0 0 1 * *' },
];

interface CronParseResult {
  description: string;
  nextRuns: Date[];
  error: string;
}

/**
 * Cron 표현식을 파싱하여 설명과 다음 실행 시간 5회를 반환
 *
 * @param {string} expression Cron 표현식
 * @returns {CronParseResult} 파싱 결과 (설명, 다음 실행 목록, 에러 메시지)
 */
const parseCron = (expression: string): CronParseResult => {
  try {
    const description = cronstrue.toString(expression, { use24HourTimeFormat: true });
    const interval = CronExpressionParser.parse(expression);
    const nextRuns = interval.take(5).map((d) => d.toDate());
    return { description, nextRuns, error: '' };
  } catch (e) {
    return { description: '', nextRuns: [], error: e instanceof Error ? e.message : '유효하지 않은 Cron 표현식입니다' };
  }
};

/**
 * Date를 한국 표준 시간 형식 문자열로 변환
 *
 * @param {Date} date 변환할 날짜
 * @returns {string} 포맷팅된 날짜 문자열
 */
const formatDate = (date: Date): string =>
  date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

export default function CronPage() {
  const [expression, setExpression] = useState('0 9 * * 1-5');

  const result = expression.trim() ? parseCron(expression.trim()) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Cron 파서</h1>
        <p className="text-sm text-muted-foreground">Cron 표현식을 해석하고 다음 실행 시간을 계산합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cron 표현식</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="* * * * *"
              className="font-mono text-base"
            />
            <CopyButton value={expression} />
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            분&nbsp;&nbsp;&nbsp; 시&nbsp;&nbsp;&nbsp; 일&nbsp;&nbsp;&nbsp; 월&nbsp;&nbsp;&nbsp; 요일
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => setExpression(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result &&
        (result.error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{result.error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">설명</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {result.description}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">다음 실행 시간 (5회)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 font-mono text-sm">
                    {result.nextRuns.map((date, i) => {
                      const formatted = formatDate(date);
                      return (
                        <div
                          key={`${i}-${date.getTime()}`}
                          className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5"
                        >
                          <span className="text-muted-foreground mr-3">{i + 1}.</span>
                          <span className="flex-1">{formatted}</span>
                          <CopyButton value={formatted} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )
        )}
    </div>
  );
}
