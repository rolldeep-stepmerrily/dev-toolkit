import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BcryptService } from './bcrypt.service';
import { HashDto } from './dto/hash.dto';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('tools/bcrypt')
@Controller('tools/bcrypt')
export class BcryptController {
  constructor(private readonly bcryptService: BcryptService) {}

  @Post('hash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bcrypt 해시 생성' })
  hash(@Body() dto: HashDto): Promise<{ hash: string }> {
    return this.bcryptService.hash(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bcrypt 해시 검증' })
  verify(@Body() dto: VerifyDto): Promise<{ isMatch: boolean }> {
    return this.bcryptService.verify(dto);
  }
}
