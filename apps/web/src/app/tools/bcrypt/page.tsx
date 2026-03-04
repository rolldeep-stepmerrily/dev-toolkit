'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const hashBcrypt = async (plainText: string, saltRounds: number): Promise<string> => {
  const res = await fetch(`${API_URL}/tools/bcrypt/hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plainText, saltRounds }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? '서버 오류');
  }
  const data = await res.json();
  return String(data.data.hash);
};

const verifyBcrypt = async (plainText: string, hash: string): Promise<boolean> => {
  const res = await fetch(`${API_URL}/tools/bcrypt/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plainText, hash }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? '서버 오류');
  }
  const data = await res.json();
  return Boolean(data.data.isMatch);
};

export default function BcryptPage() {
  const [hashPlain, setHashPlain] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [hashResult, setHashResult] = useState('');
  const [hashLoading, setHashLoading] = useState(false);
  const [hashError, setHashError] = useState('');

  const [verifyPlain, setVerifyPlain] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleHash = async () => {
    if (!hashPlain) return;
    setHashLoading(true);
    setHashError('');
    setHashResult('');
    try {
      setHashResult(await hashBcrypt(hashPlain, saltRounds));
    } catch (e) {
      setHashError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setHashLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!(verifyPlain && verifyHash)) return;
    setVerifyLoading(true);
    setVerifyError('');
    setVerifyResult(null);
    try {
      setVerifyResult(await verifyBcrypt(verifyPlain, verifyHash));
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Bcrypt 생성/검증기</h1>
        <p className="text-sm text-muted-foreground">
          비밀번호를 bcrypt로 해시하고 검증합니다. 연산은 서버에서 처리됩니다.{' '}
          <span className="text-amber-600 dark:text-amber-400">
            입력한 평문이 서버로 전송되므로 실제 비밀번호를 사용하지 마세요.
          </span>
        </p>
      </div>

      {/* 해시 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">해시 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>평문 (Plain Text)</Label>
            <Input
              type="password"
              placeholder="해시할 비밀번호"
              value={hashPlain}
              onChange={(e) => setHashPlain(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Salt Rounds</Label>
              <span className="text-sm font-mono font-medium">{saltRounds}</span>
            </div>
            <Slider
              min={1}
              max={14}
              step={1}
              value={[saltRounds]}
              onValueChange={([v]) => setSaltRounds(v)}
            />
            <p className="text-xs text-muted-foreground">높을수록 안전하지만 느립니다. 10~12를 권장합니다.</p>
          </div>
          {hashError && <p className="text-sm text-destructive">{hashError}</p>}
          <Button
            onClick={handleHash}
            disabled={!hashPlain || hashLoading}
          >
            {hashLoading ? '처리 중...' : '해시 생성'}
          </Button>
          {hashResult && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>bcrypt 해시</Label>
                <CopyButton value={hashResult} />
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">{hashResult}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 해시 검증 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">해시 검증</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>평문 (Plain Text)</Label>
            <Input
              type="password"
              placeholder="비교할 비밀번호"
              value={verifyPlain}
              onChange={(e) => {
                setVerifyPlain(e.target.value);
                setVerifyResult(null);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>bcrypt 해시</Label>
            <Textarea
              placeholder="$2b$10$..."
              value={verifyHash}
              onChange={(e) => {
                setVerifyHash(e.target.value);
                setVerifyResult(null);
              }}
              rows={2}
              className="font-mono text-sm"
            />
          </div>
          {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
          <Button
            onClick={handleVerify}
            disabled={!(verifyPlain && verifyHash) || verifyLoading}
          >
            {verifyLoading ? '검증 중...' : '검증'}
          </Button>
          {verifyResult !== null && (
            <Badge
              variant={verifyResult ? 'secondary' : 'destructive'}
              className="text-sm"
            >
              {verifyResult ? '✓ 일치합니다' : '✗ 일치하지 않습니다'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
