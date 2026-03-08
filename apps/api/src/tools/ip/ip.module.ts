import { Module } from '@nestjs/common';
import { GetMyIpUseCase } from './application/use-cases/get-my-ip.use-case';
import { IpHttpController } from './presenter/http/ip.http.controller';

@Module({
  controllers: [IpHttpController],
  providers: [
    /** use-cases */
    GetMyIpUseCase,
  ],
})
export class IpModule {}
