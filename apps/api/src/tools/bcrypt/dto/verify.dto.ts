import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({ example: 'myPassword123' })
  @IsString()
  plainText!: string;

  @ApiProperty({ example: '$2b$10$...' })
  @IsString()
  hash!: string;
}
