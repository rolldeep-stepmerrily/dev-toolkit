'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type IndentType = '2' | '4' | 'tab';

const jsonToYaml = (obj: unknown, indent = 0): string => {
  const pad = '  '.repeat(indent);
  if (obj === null) {
    return 'null';
  }
  if (typeof obj === 'string') {
    return obj.includes('\n')
      ? `|\n${obj
          .split('\n')
          .map((l) => `${pad}  ${l}`)
          .join('\n')}`
      : obj;
  }
  if (typeof obj !== 'object') {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    return obj.map((item) => `${pad}- ${jsonToYaml(item, indent + 1)}`).join('\n');
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) {
    return '{}';
  }
  return entries
    .map(([k, v]) => {
      const val = jsonToYaml(v, indent + 1);
      return typeof v === 'object' && v !== null ? `${pad}${k}:\n${val}` : `${pad}${k}: ${val}`;
    })
    .join('\n');
};

export default function JsonPage() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<IndentType>('2');
  const [error, setError] = useState('');
  const [yamlOutput, setYamlOutput] = useState('');

  const getIndentValue = () => (indent === 'tab' ? '\t' : Number(indent));

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, getIndentValue()));
      setError('');
      setYamlOutput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 오류');
    }
  };

  const minify = () => {
    try {
      setInput(JSON.stringify(JSON.parse(input)));
      setError('');
      setYamlOutput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 오류');
    }
  };

  const toYaml = () => {
    try {
      const parsed = JSON.parse(input);
      setYamlOutput(jsonToYaml(parsed));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 오류');
    }
  };

  const validate = () => {
    try {
      JSON.parse(input);
      setError('✓ 유효한 JSON입니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 오류');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">JSON 포맷터</h1>
        <p className="text-sm text-muted-foreground">JSON을 포맷팅, 압축, 변환합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">JSON 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder='{"key": "value"}'
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
              setYamlOutput('');
            }}
            rows={12}
            className="font-mono text-sm"
          />
          {error && (
            <p
              className={`text-sm ${error.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label>들여쓰기</Label>
              <Select
                value={indent}
                onValueChange={(v) => setIndent(v as IndentType)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="tab">Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={format}
            >
              포맷팅
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={minify}
            >
              압축 (Minify)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={validate}
            >
              유효성 검사
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toYaml}
            >
              → YAML
            </Button>
          </div>
        </CardContent>
      </Card>

      {yamlOutput && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">YAML 결과</CardTitle>
              <CopyButton value={yamlOutput} />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {yamlOutput}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
