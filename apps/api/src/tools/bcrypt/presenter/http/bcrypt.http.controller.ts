import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HashUseCase } from 'src/tools/bcrypt/application/use-cases/hash.use-case';
import { VerifyUseCase } from 'src/tools/bcrypt/application/use-cases/verify.use-case';
import { BcryptRouter } from './bcrypt.path.presenter';
import { HashRequestDto, HashResponseDto } from './dto/hash.dto';
import { VerifyRequestDto, VerifyResponseDto } from './dto/verify.dto';

@Throttle({ default: { limit: 10, ttl: 60_000 } })
@ApiTags(BcryptRouter.HttpApiTags)
@Controller(BcryptRouter.Root)
export class BcryptHttpController {
  constructor(
    private readonly hashUseCase: HashUseCase,
    private readonly verifyUseCase: VerifyUseCase,
  ) {}

  @ApiOperation({ summary: 'bcrypt 해시 생성' })
  @Post(BcryptRouter.Http.Hash)
  @HttpCode(HttpStatus.OK)
  hash(@Body() bodyDto: HashRequestDto): Promise<HashResponseDto> {
    return this.hashUseCase.execute({ bodyDto });
  }

  @ApiOperation({ summary: 'bcrypt 해시 검증' })
  @Post(BcryptRouter.Http.Verify)
  @HttpCode(HttpStatus.OK)
  verify(@Body() bodyDto: VerifyRequestDto): Promise<VerifyResponseDto> {
    return this.verifyUseCase.execute({ bodyDto });
  }
}
