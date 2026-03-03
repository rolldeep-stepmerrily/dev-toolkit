import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @ApiOperation({ summary: '서버 상태 조회' })
  @ApiOkResponse({
    description: '서버 상태 조회 성공',
    type: String,
  })
  @Get()
  get(): string {
    return 'ok';
  }
}
