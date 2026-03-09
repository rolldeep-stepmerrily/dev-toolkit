'use client';

import { diffLines, diffWords, type Change } from 'diff';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type DiffMode = 'lines' | 'words';

/**
 * diff 모드에 따라 두 텍스트의 차이를 계산
 *
 * @param {string} original 원본 텍스트
 * @param {string} modified 수정된 텍스트
 * @param {DiffMode} mode 비교 단위 (줄 / 단어)
 * @returns {Change[]} 변경 청크 목록
 */
const computeDiff = (original: string, modified: string, mode: DiffMode): Change[] => {
  if (mode === 'words') return diffWords(original, modified);
  return diffLines(original, modified);
};

interface DiffChunkProps {
  change: Change;
}

/**
 * diff 변경 청크를 색상으로 시각화하는 컴포넌트
 *
 * @param {DiffChunkProps} props
 * @returns {React.JSX.Element}
 */
const DiffChunk = ({ change }: DiffChunkProps): React.JSX.Element => {
  const value = change.value;

  if (change.added) {
    return (
      <span className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
        {value}
      </span>
    );
  }
  if (change.removed) {
    return (
      <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 line-through">
        {value}
      </span>
    );
  }
  return <span>{value}</span>;
};

export default function DiffPage() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [mode, setMode] = useState<DiffMode>('lines');

  const hasInput = original.trim().length > 0 || modified.trim().length > 0;
  const changes = hasInput ? computeDiff(original, modified, mode) : [];

  const added = changes.filter((c) => c.added).length;
  const removed = changes.filter((c) => c.removed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Diff 뷰어</h1>
        <p className="text-sm text-muted-foreground">두 텍스트의 차이를 시각화합니다. 모든 처리는 브라우저에서 이루어집니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">원본</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="원본 텍스트를 입력하세요..."
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              rows={14}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">수정본</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="수정된 텍스트를 입력하세요..."
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              rows={14}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {hasInput && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Diff 결과</CardTitle>
                <span className="text-xs text-green-600 dark:text-green-400">+{added} 추가</span>
                <span className="text-xs text-red-600 dark:text-red-400">-{removed} 삭제</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">비교 단위</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as DiffMode)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lines">줄</SelectItem>
                    <SelectItem value="words">단어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-6">
              {changes.map((change, i) => (
                <DiffChunk
                  key={i}
                  change={change}
                />
              ))}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
