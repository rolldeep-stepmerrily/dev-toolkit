'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const parseQuery = (url: string): { key: string; value: string }[] => {
  try {
    const u = new URL(url.includes('://') ? url : `https://x.com?${url}`);
    return Array.from(u.searchParams.entries()).map(([key, value]) => ({ key, value }));
  } catch {
    return [];
  }
};

export default function UrlPage() {
  const [encodeInput, setEncodeInput] = useState('');
  const [decodeInput, setDecodeInput] = useState('');

  const encoded = encodeInput ? encodeURIComponent(encodeInput) : '';
  const decoded = (() => {
    if (!decodeInput) return '';
    try {
      return decodeURIComponent(decodeInput);
    } catch {
      return '유효하지 않은 URL 인코딩';
    }
  })();

  const queryParams = decodeInput ? parseQuery(decodeInput) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">URL 인코더/디코더</h1>
        <p className="text-sm text-muted-foreground">URL을 인코딩/디코딩하고 쿼리 파라미터를 분석합니다.</p>
      </div>

      {/* 인코딩 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">텍스트 → URL 인코딩</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="인코딩할 텍스트를 입력하세요"
            value={encodeInput}
            onChange={(e) => setEncodeInput(e.target.value)}
            rows={3}
          />
          {encoded && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>결과</Label>
                <CopyButton value={encoded} />
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">{encoded}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 디코딩 + 쿼리 파싱 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">URL 디코딩 / 쿼리 파싱</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="디코딩할 URL 또는 쿼리스트링을 입력하세요"
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            rows={3}
          />
          {decoded && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>디코딩 결과</Label>
                <CopyButton value={decoded} />
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">{decoded}</div>
            </div>
          )}
          {queryParams.length > 0 && (
            <div>
              <Label className="mb-2 block">쿼리 파라미터</Label>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Key</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {queryParams.map((p) => (
                    <tr
                      key={`${p.key}=${p.value}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono">{p.key}</td>
                      <td className="py-2 font-mono break-all">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
