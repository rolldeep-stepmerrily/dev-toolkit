import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class SignUpRequestBodyDto {
  @ApiProperty({
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123!',
    type: String,
  })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
  password!: string;

  @ApiProperty({
    example: 'John Doe',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SignUpResponseDataDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  refreshToken!: string;

  static from(data: SignUpResponseDataDto): SignUpResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }
}
