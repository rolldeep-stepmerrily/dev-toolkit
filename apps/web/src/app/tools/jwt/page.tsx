'use client';

import { decodeJwt, decodeProtectedHeader } from 'jose';
import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type Algorithm = 'HS256' | 'HS384' | 'HS512';

const signJwt = async (payload: string, secret: string, alg: Algorithm): Promise<string> => {
  const { SignJWT } = await import('jose');
  let payloadObj: Record<string, unknown>;
  try {
    payloadObj = JSON.parse(payload);
  } catch {
    throw new Error('Payload가 유효한 JSON이 아닙니다.');
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: `SHA-${alg.slice(2)}` },
    false,
    ['sign'],
  );
  return new SignJWT(payloadObj).setProtectedHeader({ alg, typ: 'JWT' }).sign(key);
};

const verifyJwt = async (token: string, secret: string, alg: Algorithm): Promise<boolean> => {
  const { jwtVerify } = await import('jose');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: `SHA-${alg.slice(2)}` },
    false,
    ['verify'],
  );
  try {
    await jwtVerify(token, key, { algorithms: [alg] });
    return true;
  } catch {
    return false;
  }
};

const tryDecode = (token: string) => {
  try {
    const header = decodeProtectedHeader(token);
    const payload = decodeJwt(token);
    return { header, payload, error: null };
  } catch (e) {
    return { header: null, payload: null, error: e instanceof Error ? e.message : '디코딩 실패' };
  }
};

const isExpired = (payload: Record<string, unknown> | null): boolean | null => {
  if (!payload?.exp) return null;
  return (payload.exp as number) < Math.floor(Date.now() / 1000);
};

interface DecodedSectionProps {
  decoded: ReturnType<typeof tryDecode>;
  expired: boolean | null;
  verifyAlg: Algorithm;
  verifySecret: string;
  verifyResult: boolean | null;
  verifyError: string;
  onAlgChange: (alg: Algorithm) => void;
  onSecretChange: (s: string) => void;
  onVerify: () => void;
}

const DecodedSection = ({
  decoded,
  expired,
  verifyAlg,
  verifySecret,
  verifyResult,
  verifyError,
  onAlgChange,
  onSecretChange,
  onVerify,
}: DecodedSectionProps) => {
  if (decoded.error) {
    return <p className="text-sm text-destructive">{decoded.error}</p>;
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Header</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payload</CardTitle>
              {expired !== null && (
                <Badge variant={expired ? 'destructive' : 'secondary'}>{expired ? '만료됨' : '유효'}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">서명 검증</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select
              value={verifyAlg}
              onValueChange={(v) => onAlgChange(v as Algorithm)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HS256">HS256</SelectItem>
                <SelectItem value="HS384">HS384</SelectItem>
                <SelectItem value="HS512">HS512</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="password"
              placeholder="Secret"
              value={verifySecret}
              onChange={(e) => onSecretChange(e.target.value)}
            />
            <Button onClick={onVerify}>검증</Button>
          </div>
          {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
          {verifyResult !== null && !verifyError && (
            <Badge variant={verifyResult ? 'secondary' : 'destructive'}>
              {verifyResult ? '✓ 서명 유효' : '✗ 서명 유효하지 않음'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function JwtPage() {
  // Generate tab
  const [genAlg, setGenAlg] = useState<Algorithm>('HS256');
  const [genPayload, setGenPayload] = useState(() =>
    JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000) }, null, 2),
  );
  const [genSecret, setGenSecret] = useState('');
  const [genResult, setGenResult] = useState('');
  const [genError, setGenError] = useState('');

  // Decode/Verify tab
  const [tokenInput, setTokenInput] = useState('');
  const [verifySecret, setVerifySecret] = useState('');
  const [verifyAlg, setVerifyAlg] = useState<Algorithm>('HS256');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState('');

  const decoded = tokenInput ? tryDecode(tokenInput) : null;
  const expired = isExpired(decoded?.payload as Record<string, unknown> | null);

  const handleGenerate = async () => {
    setGenError('');
    setGenResult('');
    if (!genSecret) {
      setGenError('Secret을 입력하세요.');
      return;
    }
    try {
      const token = await signJwt(genPayload, genSecret, genAlg);
      setGenResult(token);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '생성 실패');
    }
  };

  const handleVerify = async () => {
    setVerifyError('');
    setVerifyResult(null);
    if (!verifySecret) {
      setVerifyError('Secret을 입력하세요.');
      return;
    }
    try {
      const ok = await verifyJwt(tokenInput, verifySecret, verifyAlg);
      setVerifyResult(ok);
    } catch (e) {
      setVerifyResult(false);
      setVerifyError(e instanceof Error ? e.message : '검증 실패');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">JWT 생성/검증기</h1>
        <p className="text-sm text-muted-foreground">
          JWT를 생성하고 디코딩하여 검증합니다. 모든 처리는 브라우저에서 이루어집니다.
        </p>
      </div>

      <Tabs defaultValue="decode">
        <TabsList>
          <TabsTrigger value="decode">디코딩 / 검증</TabsTrigger>
          <TabsTrigger value="generate">생성</TabsTrigger>
        </TabsList>

        {/* 디코딩 탭 */}
        <TabsContent
          value="decode"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">JWT 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setVerifyResult(null);
                  setVerifyError('');
                }}
                rows={4}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {decoded && (
            <DecodedSection
              decoded={decoded}
              expired={expired}
              verifyAlg={verifyAlg}
              verifySecret={verifySecret}
              verifyResult={verifyResult}
              verifyError={verifyError}
              onAlgChange={setVerifyAlg}
              onSecretChange={setVerifySecret}
              onVerify={handleVerify}
            />
          )}
        </TabsContent>

        {/* 생성 탭 */}
        <TabsContent
          value="generate"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">JWT 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>알고리즘</Label>
                <Select
                  value={genAlg}
                  onValueChange={(v) => setGenAlg(v as Algorithm)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HS256">HS256</SelectItem>
                    <SelectItem value="HS384">HS384</SelectItem>
                    <SelectItem value="HS512">HS512</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={genPayload}
                  onChange={(e) => setGenPayload(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Secret</Label>
                <Input
                  type="password"
                  placeholder="Secret key"
                  value={genSecret}
                  onChange={(e) => setGenSecret(e.target.value)}
                />
              </div>
              {genError && <p className="text-sm text-destructive">{genError}</p>}
              <Button onClick={handleGenerate}>JWT 생성</Button>
            </CardContent>
          </Card>

          {genResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">생성된 JWT</CardTitle>
                  <CopyButton value={genResult} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">{genResult}</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
