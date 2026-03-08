import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { GetMyIpResponseDto } from 'src/tools/ip/presenter/http/dto/get-my-ip.dto';

@Injectable()
export class GetMyIpUseCase {
  /**
   * 요청자 IP 정보 반환 실행
   *
   * @param {GetMyIpUseCaseProps} props 요청 데이터
   * @returns {GetMyIpResponseDto} IPv4, IPv6 분류 결과
   */
  execute(props: GetMyIpUseCaseProps): GetMyIpResponseDto {
    const { req } = props;
    const raw = this.extractIp(req);

    return this.classifyIp(raw);
  }

  /**
   * 요청에서 클라이언트 IP를 추출
   *
   * @remarks X-Forwarded-For 헤더는 클라이언트가 위조할 수 있으므로
   * 프로덕션에서는 신뢰할 수 있는 프록시 수 만큼 오른쪽에서 역순으로 IP를 선택해야 합니다.
   * 현재는 단순 IP 확인 도구 용도로 헤더 첫 번째 값을 사용합니다.
   *
   * @param {Request} req Express Request 객체
   * @returns {string} 클라이언트 IP 문자열
   */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const first = raw.split(',')[0];
      return first.trim();
    }

    return req.socket.remoteAddress ?? req.ip ?? 'unknown';
  }

  /**
   * IP 주소 문자열을 IPv4/IPv6로 분류
   *
   * @param {string} ip IP 주소 문자열
   * @returns {GetMyIpResponseDto} IPv4, IPv6 분류 결과
   */
  private classifyIp(ip: string): GetMyIpResponseDto {
    if (ip.startsWith('::ffff:')) {
      const v4 = ip.slice(7);

      return GetMyIpResponseDto.from(v4, ip);
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return GetMyIpResponseDto.from(ip, `::ffff:${ip}`);
    }

    return GetMyIpResponseDto.from(null, ip);
  }
}

interface GetMyIpUseCaseProps {
  req: Request;
}
