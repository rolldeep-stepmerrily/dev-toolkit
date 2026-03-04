import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { IpService } from './ip.service';

@ApiTags('tools/ip')
@Controller('tools/ip')
export class IpController {
  constructor(private readonly ipService: IpService) {}

  @Get('me')
  @ApiOperation({ summary: '요청자 IP 확인' })
  getMyIp(@Req() req: Request): { ipv4: string | null; ipv6: string | null } {
    return this.ipService.getMyIp(req);
  }
}
