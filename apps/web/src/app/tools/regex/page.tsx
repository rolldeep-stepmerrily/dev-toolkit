'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FLAGS = ['g', 'i', 'm', 's', 'u'] as const;
type Flag = (typeof FLAGS)[number];

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

const buildRegex = (pattern: string, flags: Set<Flag>): RegExp | null => {
  if (!pattern) return null;
  try {
    return new RegExp(pattern, Array.from(flags).join(''));
  } catch {
    return null;
  }
};

const getMatches = (text: string, regex: RegExp | null): MatchResult[] => {
  if (!(regex && text)) return [];
  const r = regex.flags.includes('g') ? regex : new RegExp(regex.source, `${regex.flags}g`);
  const results: MatchResult[] = [];
  let match = r.exec(text);
  while (match !== null) {
    results.push({ match: match[0], index: match.index, groups: match.slice(1) });
    if (!regex.flags.includes('g')) break;
    if (match[0].length === 0) r.lastIndex++;
    match = r.exec(text);
  }
  return results;
};

const highlightText = (text: string, matches: MatchResult[]): React.ReactNode[] => {
  if (matches.length === 0) return [text];
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const m of matches) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <mark
        key={m.index}
        className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800"
      >
        {m.match}
      </mark>,
    );
    last = m.index + m.match.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

export default function RegexPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Set<Flag>>(new Set(['g']));
  const [testText, setTestText] = useState('');
  const [replaceWith, setReplaceWith] = useState('');

  const regex = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);
  const isInvalid = pattern !== '' && regex === null;
  const matches = useMemo(() => getMatches(testText, regex), [testText, regex]);

  const replaceResult = useMemo(() => {
    if (!(regex && testText) || replaceWith === '') return '';
    try {
      return testText.replace(regex, replaceWith);
    } catch {
      return '';
    }
  }, [testText, regex, replaceWith]);

  const toggleFlag = (f: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">정규식 테스터</h1>
        <p className="text-sm text-muted-foreground">정규식 패턴을 작성하고 실시간으로 매칭을 확인합니다.</p>
      </div>

      {/* 패턴 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">패턴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono">/</span>
            <Input
              placeholder="정규식 패턴"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className={`font-mono ${isInvalid ? 'border-destructive' : ''}`}
            />
            <span className="text-muted-foreground font-mono">/</span>
            <span className="font-mono text-sm text-muted-foreground">{Array.from(flags).join('')}</span>
          </div>
          {isInvalid && <p className="text-sm text-destructive">유효하지 않은 정규식입니다.</p>}
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFlag(f)}
                className={`rounded border px-3 py-1 font-mono text-sm transition-colors ${
                  flags.has(f) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 테스트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">테스트 문자열</CardTitle>
            {matches.length > 0 && <Badge variant="secondary">{matches.length}개 매칭</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="테스트할 문자열을 입력하세요"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={5}
          />
          {testText && matches.length > 0 && (
            <div>
              <Label className="mb-1 block">매칭 하이라이트</Label>
              <div className="rounded-md bg-muted p-3 font-mono text-sm whitespace-pre-wrap">
                {highlightText(testText, matches)}
              </div>
            </div>
          )}
          {testText && pattern && matches.length === 0 && !isInvalid && (
            <p className="text-sm text-muted-foreground">매칭 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 매칭 목록 */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">매칭 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">#</th>
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">매칭</th>
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">위치</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">그룹</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr
                    key={`${m.index}-${m.match}`}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 font-mono">{m.match}</td>
                    <td className="py-2 pr-4 font-mono">{m.index}</td>
                    <td className="py-2 font-mono">{m.groups.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 치환 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">치환</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>치환 문자열 ($1, $2로 캡처 그룹 참조)</Label>
            <Input
              placeholder="치환할 문자열"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
            />
          </div>
          {replaceResult && (
            <div className="rounded-md bg-muted p-3 font-mono text-sm whitespace-pre-wrap">{replaceResult}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
