import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class HashRequestDto {
  @ApiProperty({ example: 'myPassword123' })
  @IsString()
  plainText!: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 14, default: 10 })
  @IsInt()
  @Min(1)
  @Max(14)
  saltRounds!: number;
}

export class HashResponseDto {
  @ApiProperty()
  hash!: string;

  static from(hash: string): HashResponseDto {
    return { hash };
  }
}
