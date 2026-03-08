import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GetMyIpUseCase } from 'src/tools/ip/application/use-cases/get-my-ip.use-case';
import { GetMyIpResponseDto } from './dto/get-my-ip.dto';
import { IpRouter } from './ip.path.presenter';

@ApiTags(IpRouter.HttpApiTags)
@Controller(IpRouter.Root)
export class IpHttpController {
  constructor(private readonly getMyIpUseCase: GetMyIpUseCase) {}

  @ApiOperation({ summary: '요청자 IP 확인' })
  @Get(IpRouter.Http.GetMyIp)
  getMyIp(@Req() req: Request): GetMyIpResponseDto {
    return this.getMyIpUseCase.execute({ req });
  }
}
