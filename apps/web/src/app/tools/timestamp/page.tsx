'use client';

import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'KST (Asia/Seoul)', value: 'Asia/Seoul' },
  { label: 'PST (America/Los_Angeles)', value: 'America/Los_Angeles' },
  { label: 'EST (America/New_York)', value: 'America/New_York' },
];

const formatDate = (date: Date, tz: string): string => date.toLocaleString('ko-KR', { timeZone: tz, hour12: false });

const tsToDate = (input: string, tz: string): string => {
  const num = Number(input.trim());
  if (!input.trim() || Number.isNaN(num)) return '';
  const ms = input.trim().length <= 10 ? num * 1000 : num;
  try {
    return formatDate(new Date(ms), tz);
  } catch {
    return '유효하지 않은 타임스탬프';
  }
};

export default function TimestampPage() {
  const [now, setNow] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [dateResult, setDateResult] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(id);
  }, []);

  const handleDateConvert = (value: string): void => {
    setDateInput(value);
    if (!value.trim()) {
      setDateResult('');

      return;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      setDateResult('유효하지 않은 날짜');

      return;
    }
    setDateResult(String(Math.floor(d.getTime() / 1000)));
  };

  const tsResult = tsToDate(tsInput, timezone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Timestamp 변환기</h1>
        <p className="text-sm text-muted-foreground">Unix 타임스탬프와 날짜/시간을 상호 변환합니다.</p>
      </div>

      {/* 현재 시각 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">현재 시각</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>타임존</Label>
            <Select
              value={timezone}
              onValueChange={setTimezone}
            >
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md bg-muted p-3 font-mono text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unix (초)</span>
              <div className="flex items-center gap-1">
                <span>{Math.floor(now.getTime() / 1000)}</span>
                <CopyButton value={String(Math.floor(now.getTime() / 1000))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unix (밀리초)</span>
              <div className="flex items-center gap-1">
                <span>{now.getTime()}</span>
                <CopyButton value={String(now.getTime())} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">날짜/시간</span>
              <div className="flex items-center gap-1">
                <span>{formatDate(now, timezone)}</span>
                <CopyButton value={formatDate(now, timezone)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 타임스탬프 → 날짜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">타임스탬프 → 날짜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Unix 타임스탬프 (초 또는 밀리초)</Label>
            <Input
              placeholder="예: 1700000000"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
            />
          </div>
          {tsResult && (
            <div className="flex items-center justify-between rounded-md bg-muted p-3 font-mono text-sm">
              <span>{tsResult}</span>
              <CopyButton value={tsResult} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 날짜 → 타임스탬프 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">날짜 → 타임스탬프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>날짜/시간</Label>
            <Input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => handleDateConvert(e.target.value)}
            />
          </div>
          {dateResult && (
            <div className="flex items-center justify-between rounded-md bg-muted p-3 font-mono text-sm">
              <span>{dateResult}</span>
              <CopyButton value={dateResult} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
