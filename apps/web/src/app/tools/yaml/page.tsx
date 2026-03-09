'use client';

import yaml from 'js-yaml';
import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface ConvertResult {
  result: string;
  error: string;
}

/**
 * YAML 문자열을 JSON 문자열로 변환
 *
 * @param {string} input YAML 문자열
 * @returns {ConvertResult} 변환 결과 또는 에러 메시지
 */
const convertYamlToJson = (input: string): ConvertResult => {
  try {
    const parsed = yaml.load(input, { schema: yaml.CORE_SCHEMA });
    return { result: JSON.stringify(parsed, null, 2), error: '' };
  } catch (e) {
    return { result: '', error: e instanceof Error ? e.message : '변환 오류' };
  }
};

/**
 * JSON 문자열을 YAML 문자열로 변환
 *
 * @param {string} input JSON 문자열
 * @returns {ConvertResult} 변환 결과 또는 에러 메시지
 */
const convertJsonToYaml = (input: string): ConvertResult => {
  try {
    const parsed = JSON.parse(input);
    return { result: yaml.dump(parsed, { indent: 2, lineWidth: -1 }), error: '' };
  } catch (e) {
    return { result: '', error: e instanceof Error ? e.message : '변환 오류' };
  }
};

export default function YamlPage() {
  const [yamlInput, setYamlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const yamlResult = yamlInput.trim() ? convertYamlToJson(yamlInput) : null;
  const jsonResult = jsonInput.trim() ? convertJsonToYaml(jsonInput) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">YAML ↔ JSON</h1>
        <p className="text-sm text-muted-foreground">YAML과 JSON을 상호 변환합니다. 모든 처리는 브라우저에서 이루어집니다.</p>
      </div>

      <Tabs defaultValue="yaml-to-json">
        <TabsList>
          <TabsTrigger value="yaml-to-json">YAML → JSON</TabsTrigger>
          <TabsTrigger value="json-to-yaml">JSON → YAML</TabsTrigger>
        </TabsList>

        {/* YAML → JSON */}
        <TabsContent
          value="yaml-to-json"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">YAML 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={'name: example\nversion: 1\ntags:\n  - foo\n  - bar'}
                value={yamlInput}
                onChange={(e) => setYamlInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYamlInput('')}
                disabled={!yamlInput}
              >
                초기화
              </Button>
            </CardContent>
          </Card>

          {yamlResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">JSON 결과</CardTitle>
                  {!yamlResult.error && <CopyButton value={yamlResult.result} />}
                </div>
              </CardHeader>
              <CardContent>
                {yamlResult.error ? (
                  <p className="text-sm text-destructive">{yamlResult.error}</p>
                ) : (
                  <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {yamlResult.result}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* JSON → YAML */}
        <TabsContent
          value="json-to-yaml"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">JSON 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={'{\n  "name": "example",\n  "version": 1\n}'}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJsonInput('')}
                disabled={!jsonInput}
              >
                초기화
              </Button>
            </CardContent>
          </Card>

          {jsonResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">YAML 결과</CardTitle>
                  {!jsonResult.error && <CopyButton value={jsonResult.result} />}
                </div>
              </CardHeader>
              <CardContent>
                {jsonResult.error ? (
                  <p className="text-sm text-destructive">{jsonResult.error}</p>
                ) : (
                  <pre className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {jsonResult.result}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
