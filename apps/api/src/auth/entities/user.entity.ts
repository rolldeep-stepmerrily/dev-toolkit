import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@@entities';

export class UserEntity extends BaseEntity {
  @ApiProperty()
  @IsNumber()
  id!: number;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl!: string | null;
}
