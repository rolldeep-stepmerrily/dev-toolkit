'use client';

import { useState } from 'react';
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UuidVersion = 'v1' | 'v4' | 'v7';

const generateUuid = (version: UuidVersion): string => {
  switch (version) {
    case 'v1':
      return uuidv1();
    case 'v4':
      return uuidv4();
    case 'v7':
      return uuidv7();
    default:
      return uuidv4();
  }
};

export default function UuidPage() {
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<string[]>([]);

  const handleGenerate = (): void => {
    const newResults = Array.from({ length: count }, () => generateUuid(version));
    setResults(newResults);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">UUID 생성기</h1>
        <p className="text-sm text-muted-foreground">
          UUID v1, v4, v7을 생성합니다. 모든 처리는 브라우저에서 이루어집니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">UUID 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>버전</Label>
              <Select
                value={version}
                onValueChange={(v) => setVersion(v as UuidVersion)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v1">v1 (시간 기반)</SelectItem>
                  <SelectItem value="v4">v4 (랜덤)</SelectItem>
                  <SelectItem value="v7">v7 (Unix 시간 기반)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>개수</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-24"
              />
            </div>
            <Button onClick={handleGenerate}>생성</Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">생성된 UUID ({results.length}개)</CardTitle>
              <CopyButton value={results.join('\n')} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {results.map((uuid) => (
                <div
                  key={uuid}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 gap-2"
                >
                  <span>{uuid}</span>
                  <CopyButton value={uuid} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
