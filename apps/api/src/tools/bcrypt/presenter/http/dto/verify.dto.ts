import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyRequestDto {
  @ApiProperty({ example: 'myPassword123' })
  @IsString()
  plainText!: string;

  @ApiProperty({ example: '$2b$10$...' })
  @IsString()
  hash!: string;
}

export class VerifyResponseDto {
  @ApiProperty()
  isMatch!: boolean;

  static from(isMatch: boolean): VerifyResponseDto {
    return { isMatch };
  }
}
