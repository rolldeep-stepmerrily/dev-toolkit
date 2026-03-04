'use client';

import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const toBase64 = (text: string, urlSafe: boolean): string => {
  const encoded = btoa(unescape(encodeURIComponent(text)));

  return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : encoded;
};

const fromBase64 = (b64: string): string => {
  try {
    const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');

    return decodeURIComponent(escape(atob(normalized)));
  } catch {
    return '유효하지 않은 Base64 문자열';
  }
};

export default function Base64Page() {
  const [encodeInput, setEncodeInput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [decodeInput, setDecodeInput] = useState('');
  const [fileResult, setFileResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const encoded = encodeInput ? toBase64(encodeInput, urlSafe) : '';
  const decoded = decodeInput ? fromBase64(decodeInput) : '';

  const [fileError, setFileError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError('파일 크기는 10MB 이하여야 합니다.');
      setFileResult('');

      return;
    }
    setFileError('');
    const reader = new FileReader();
    reader.onload = () => setFileResult(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Base64 인코더/디코더</h1>
        <p className="text-sm text-muted-foreground">텍스트와 파일을 Base64로 변환합니다.</p>
      </div>

      {/* 인코딩 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">텍스트 → Base64</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="인코딩할 텍스트를 입력하세요"
            value={encodeInput}
            onChange={(e) => setEncodeInput(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="url-safe"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="url-safe">URL-safe (+/= 제거)</Label>
          </div>
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

      {/* 디코딩 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base64 → 텍스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="디코딩할 Base64 문자열을 입력하세요"
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            rows={4}
          />
          {decoded && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>결과</Label>
                <CopyButton value={decoded} />
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">{decoded}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 파일 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">파일 → Base64 Data URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            파일 선택
          </Button>
          {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          {fileResult && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>Data URL</Label>
                <CopyButton value={fileResult} />
              </div>
              <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-3 font-mono text-xs break-all">
                {fileResult}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
