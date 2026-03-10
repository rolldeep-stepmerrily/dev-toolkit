'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const hexToRgb = (hex: string): Rgb | null => {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return null;
  }
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }: Rgb): string => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
      default:
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (h < 60) {
    rn = c;
    gn = x;
  } else if (h < 120) {
    rn = x;
    gn = c;
  } else if (h < 180) {
    gn = c;
    bn = x;
  } else if (h < 240) {
    gn = x;
    bn = c;
  } else if (h < 300) {
    rn = x;
    bn = c;
  } else {
    rn = c;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
};

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export default function ColorPage() {
  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState<Rgb>({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState<Hsl>({ h: 217, s: 91, l: 60 });
  const [hexError, setHexError] = useState('');

  const applyFromRgb = (newRgb: Rgb): void => {
    setRgb(newRgb);
    setHex(rgbToHex(newRgb));
    setHsl(rgbToHsl(newRgb));
    setHexError('');
  };

  const handleHexChange = (value: string): void => {
    setHex(value);
    const result = hexToRgb(value);
    if (result) {
      setRgb(result);
      setHsl(rgbToHsl(result));
      setHexError('');
    } else {
      setHexError('유효하지 않은 HEX 값입니다');
    }
  };

  const handleHslChange = (field: keyof Hsl, value: number): void => {
    const maxMap: Record<keyof Hsl, number> = { h: 360, s: 100, l: 100 };
    const newHsl = { ...hsl, [field]: clamp(value, 0, maxMap[field]) };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb));
    setHexError('');
  };

  const hexDisplay = hex.startsWith('#') ? hex : `#${hex}`;
  const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Color 변환기</h1>
        <p className="text-sm text-muted-foreground">HEX, RGB, HSL 색상 형식을 상호 변환합니다.</p>
      </div>

      {/* 색상 미리보기 */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="w-full h-24 rounded-md border"
            style={{ backgroundColor: hexDisplay }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-muted-foreground">HEX</span>
              <span>{hexDisplay}</span>
              <CopyButton value={hexDisplay} />
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-muted-foreground">RGB</span>
              <span>{rgbString}</span>
              <CopyButton value={rgbString} />
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-muted-foreground">HSL</span>
              <span>{hslString}</span>
              <CopyButton value={hslString} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* HEX 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HEX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexDisplay}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border p-0.5"
              />
              <Input
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
            </div>
            {hexError && <p className="text-xs text-destructive">{hexError}</p>}
          </CardContent>
        </Card>

        {/* RGB 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RGB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div
                key={ch}
                className="flex items-center gap-2"
              >
                <Label className="w-4 uppercase">{ch}</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => applyFromRgb({ ...rgb, [ch]: clamp(Number(e.target.value), 0, 255) })}
                  className="font-mono"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* HSL 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HSL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                { key: 'h', label: 'H', max: 360, unit: '°' },
                { key: 's', label: 'S', max: 100, unit: '%' },
                { key: 'l', label: 'L', max: 100, unit: '%' },
              ] as const
            ).map(({ key, label, max, unit }) => (
              <div
                key={key}
                className="flex items-center gap-2"
              >
                <Label className="w-4">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={max}
                  value={hsl[key]}
                  onChange={(e) => handleHslChange(key, Number(e.target.value))}
                  className="font-mono"
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
