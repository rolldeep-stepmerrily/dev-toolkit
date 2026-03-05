'use client';

import { useCallback, useEffect, useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface MyIp {
  ipv4: string | null;
  ipv6: string | null;
}

interface CidrInfo {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  mask: string;
  prefix: number;
}

const parseCidr = (cidr: string): CidrInfo | null => {
  const [ip, prefixStr] = cidr.split('/');
  if (!(ip && prefixStr)) return null;
  const prefix = Number.parseInt(prefixStr, 10);
  if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) return null;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;

  const ipNum = parts.reduce((acc, p) => (acc << 8) | p, 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const firstHost = prefix < 31 ? network + 1 : network;
  const lastHost = prefix < 31 ? broadcast - 1 : broadcast;
  const totalHosts = prefix < 31 ? 2 ** (32 - prefix) - 2 : 2 ** (32 - prefix);

  const toIp = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
  const maskParts = [(mask >>> 24) & 0xff, (mask >>> 16) & 0xff, (mask >>> 8) & 0xff, mask & 0xff].join('.');

  return {
    network: toIp(network),
    broadcast: toIp(broadcast),
    firstHost: toIp(firstHost),
    lastHost: toIp(lastHost),
    totalHosts,
    mask: maskParts,
    prefix,
  };
};

const ipv4ToIpv6 = (ip: string): string => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return '유효하지 않은 IPv4';
  return `::ffff:${ip}`;
};

const ipv6ToIpv4 = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    const v4 = ip.slice(7);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4;
  }
  return 'IPv4-mapped IPv6 형식만 변환 가능합니다. (예: ::ffff:1.2.3.4)';
};

export default function IpPage() {
  const [myIp, setMyIp] = useState<MyIp | null>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState('');

  const [cidrInput, setCidrInput] = useState('');
  const [cidrResult, setCidrResult] = useState<CidrInfo | null>(null);
  const [cidrError, setCidrError] = useState('');

  const [convertInput, setConvertInput] = useState('');
  const [convertResult, setConvertResult] = useState('');

  const fetchMyIp = useCallback(async () => {
    setIpLoading(true);
    setIpError('');
    try {
      if (!API_URL) throw new Error('API 서버 URL이 설정되지 않았습니다. (.env.local 확인)');
      const res = await fetch(`${API_URL}/tools/ip/me`);
      if (!res.ok) throw new Error('IP 조회 실패');
      const data = await res.json();
      setMyIp(data.data);
    } catch (e) {
      setIpError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setIpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyIp();
  }, [fetchMyIp]);

  const handleCidr = () => {
    setCidrError('');
    const result = parseCidr(cidrInput.trim());
    if (!result) {
      setCidrError('유효하지 않은 CIDR 표기법입니다. (예: 192.168.1.0/24)');
      setCidrResult(null);
    } else {
      setCidrResult(result);
    }
  };

  const handleConvert = (value: string) => {
    setConvertInput(value);
    if (!value.trim()) {
      setConvertResult('');
      return;
    }
    if (value.includes(':')) {
      setConvertResult(ipv6ToIpv4(value.trim()));
    } else {
      setConvertResult(ipv4ToIpv6(value.trim()));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">IP 주소 확인기</h1>
        <p className="text-sm text-muted-foreground">현재 IP를 확인하고 IPv4/IPv6 변환, CIDR 계산을 합니다.</p>
      </div>

      {/* 현재 IP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">내 IP 주소</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMyIp}
              disabled={ipLoading}
            >
              {ipLoading ? '확인 중...' : '새로 고침'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ipError && <p className="text-sm text-destructive">{ipError}</p>}
          {myIp && (
            <div className="space-y-2 font-mono text-sm">
              {myIp.ipv4 && (
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <div>
                    <Badge
                      variant="secondary"
                      className="mr-2 text-xs"
                    >
                      IPv4
                    </Badge>
                    {myIp.ipv4}
                  </div>
                  <CopyButton value={myIp.ipv4} />
                </div>
              )}
              {myIp.ipv6 && (
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <div>
                    <Badge
                      variant="secondary"
                      className="mr-2 text-xs"
                    >
                      IPv6
                    </Badge>
                    {myIp.ipv6}
                  </div>
                  <CopyButton value={myIp.ipv6} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CIDR 계산 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CIDR 계산기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="예: 192.168.1.0/24"
              value={cidrInput}
              onChange={(e) => setCidrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCidr()}
            />
            <Button onClick={handleCidr}>계산</Button>
          </div>
          {cidrError && <p className="text-sm text-destructive">{cidrError}</p>}
          {cidrResult && (
            <table className="w-full text-sm border-collapse">
              <tbody>
                {[
                  ['네트워크 주소', cidrResult.network],
                  ['브로드캐스트', cidrResult.broadcast],
                  ['서브넷 마스크', `${cidrResult.mask} (/${cidrResult.prefix})`],
                  ['첫 번째 호스트', cidrResult.firstHost],
                  ['마지막 호스트', cidrResult.lastHost],
                  ['사용 가능한 호스트 수', cidrResult.totalHosts.toLocaleString()],
                ].map(([label, value]) => (
                  <tr
                    key={label}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                    <td className="py-2 font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* IPv4 ↔ IPv6 변환 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">IPv4 ↔ IPv6 변환</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>IP 주소 (IPv4 또는 IPv6 입력)</Label>
            <Input
              placeholder="예: 192.168.1.1 또는 ::ffff:192.168.1.1"
              value={convertInput}
              onChange={(e) => handleConvert(e.target.value)}
            />
          </div>
          {convertResult && (
            <div className="flex items-center justify-between rounded-md bg-muted p-3 font-mono text-sm">
              <span>{convertResult}</span>
              <CopyButton value={convertResult} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
