import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginRequestBodyDto {
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
}

export class LoginResponseDataDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  refreshToken!: string;

  static from(data: LoginResponseDataDto): LoginResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }
}
