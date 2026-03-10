'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const ERROR_LEVELS: { value: ErrorCorrectionLevel; label: string; description: string }[] = [
  { value: 'L', label: 'L', description: '낮음 (~7%)' },
  { value: 'M', label: 'M', description: '중간 (~15%)' },
  { value: 'Q', label: 'Q', description: '높음 (~25%)' },
  { value: 'H', label: 'H', description: '최고 (~30%)' },
];

export default function QrPage() {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<ErrorCorrectionLevel>('M');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = (): void => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'qrcode.png';
      a.click();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const hasValue = text.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">QR 코드 생성기</h1>
        <p className="text-sm text-muted-foreground">
          텍스트 또는 URL로 QR 코드를 생성합니다. 모든 처리는 브라우저에서 이루어집니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>텍스트 / URL</Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>크기: {size}px</Label>
              <Slider
                min={128}
                max={512}
                step={16}
                value={[size]}
                onValueChange={([v]) => setSize(v)}
              />
            </div>

            <div className="space-y-1">
              <Label>오류 복원 수준</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as ErrorCorrectionLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_LEVELS.map((l) => (
                    <SelectItem
                      key={l.value}
                      value={l.value}
                    >
                      {l.label} — {l.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="space-y-1">
                <Label>전경색</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border p-0.5"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-28 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>배경색</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border p-0.5"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-28 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR 코드 미리보기 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">미리보기</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {hasValue ? (
              <>
                <div className="rounded-md border p-4 inline-block">
                  <QRCodeSVG
                    ref={svgRef}
                    value={text}
                    size={Math.min(size, 280)}
                    level={level}
                    fgColor={fgColor}
                    bgColor={bgColor}
                  />
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  PNG 다운로드
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                텍스트를 입력하면 QR 코드가 생성됩니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
