'use client';

import CryptoJS from 'crypto-js';
import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

const ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];

const computeHash = (text: string, algorithm: HashAlgorithm): string => {
  switch (algorithm) {
    case 'MD5':
      return CryptoJS.MD5(text).toString();
    case 'SHA-1':
      return CryptoJS.SHA1(text).toString();
    case 'SHA-256':
      return CryptoJS.SHA256(text).toString();
    case 'SHA-512':
      return CryptoJS.SHA512(text).toString();
  }
};

export default function HashPage() {
  const [input, setInput] = useState('');

  const hashes = input
    ? ALGORITHMS.map((alg) => ({ algorithm: alg, hash: computeHash(input, alg) }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Hash 생성기</h1>
        <p className="text-sm text-muted-foreground">텍스트를 MD5, SHA-1, SHA-256, SHA-512로 해시합니다. 모든 처리는 브라우저에서 이루어집니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">입력 텍스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="해시할 텍스트를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('')}
            disabled={!input}
          >
            초기화
          </Button>
        </CardContent>
      </Card>

      {hashes.length > 0 && (
        <div className="space-y-3">
          {hashes.map(({ algorithm, hash }) => (
            <Card key={algorithm}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">{algorithm}</CardTitle>
                  <CopyButton value={hash} />
                </div>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">{hash}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
