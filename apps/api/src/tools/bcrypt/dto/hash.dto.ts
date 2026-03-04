import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class HashDto {
  @ApiProperty({ example: 'myPassword123' })
  @IsString()
  plainText!: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 14, default: 10 })
  @IsInt()
  @Min(1)
  @Max(14)
  saltRounds!: number;
}
