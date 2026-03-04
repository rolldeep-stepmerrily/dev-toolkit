import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface IpInfo {
  ipv4: string | null;
  ipv6: string | null;
}

/**
 * 요청에서 클라이언트 IP를 추출
 *
 * @remarks X-Forwarded-For 헤더는 클라이언트가 위조할 수 있으므로
 * 프로덕션에서는 신뢰할 수 있는 프록시 수 만큼 오른쪽에서 역순으로 IP를 선택해야 합니다.
 * 현재는 단순 IP 확인 도구 용도로 헤더 첫 번째 값을 사용합니다.
 *
 * @param req Express Request 객체
 * @returns 클라이언트 IP 문자열
 */
const extractIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = raw.split(',')[0];
    return first.trim();
  }

  return req.socket.remoteAddress ?? req.ip ?? 'unknown';
};

/**
 * IP 주소 문자열을 IPv4/IPv6로 분류
 *
 * @param ip IP 주소 문자열
 * @returns IPv4, IPv6 분류 결과
 */
const classifyIp = (ip: string): IpInfo => {
  if (ip.startsWith('::ffff:')) {
    const v4 = ip.slice(7);

    return { ipv4: v4, ipv6: ip };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return { ipv4: ip, ipv6: `::ffff:${ip}` };
  }

  return { ipv4: null, ipv6: ip };
};

@Injectable()
export class IpService {
  /**
   * 요청자 IP 정보 반환
   *
   * @param req Express Request 객체
   * @returns IPv4, IPv6 분류 결과
   */
  getMyIp(req: Request): IpInfo {
    const raw = extractIp(req);

    return classifyIp(raw);
  }
}
