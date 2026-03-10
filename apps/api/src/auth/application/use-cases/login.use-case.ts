import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';
import { AUTH_ERRORS } from 'src/auth/auth.error';
import { LoginRequestBodyDto, LoginResponseDataDto } from 'src/auth/presenter/http/dto/login.dto';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import type { JwtExpiresIn } from 'src/common/types/jwt.types';
import { GetOneUserByEmailQuery } from 'src/users/application/queries/get-one-user-by-email.query';
import { UserEntity } from 'src/users/entities/user.entity';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveRefreshTokenCommand>,
    private readonly queryBus: TypedQueryBus<GetOneUserByEmailQuery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(props: LoginUseCaseProps): Promise<LoginResponseDataDto> {
    const { email, password } = props.bodyDto;

    const user = await this.getUserByEmail(email);

    if (!isDefined(user.password)) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const tokens = await this.issueTokens(user);

    return this.buildResponseDataDto(tokens);
  }

  /**
   * 응답 데이터 생성
   *
   * @param {string} accessToken 액세스 토큰
   * @param {string} refreshToken 리프레시 토큰
   * @returns {Promise<LoginResponseDataDto>} 응답 데이터
   */
  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): LoginResponseDataDto {
    return LoginResponseDataDto.from(tokens);
  }

  /**
   * 토큰 발행
   *
   * @param {UserEntity} user 사용자 정보
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} 발급된 토큰 쌍
   */
  async issueTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: user.id, email: user.email };

    const tokens = {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as JwtExpiresIn,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as JwtExpiresIn,
      }),
    };

    const refreshTtlDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const expiresAt = dayjs().add(refreshTtlDays, 'day').toDate();

    await this.saveRefreshToken({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    });

    return tokens;
  }

  /**
   * 리프레시 토큰 저장
   *
   * @param {number} userId 사용자 ID
   * @param {string} token 리프레시 토큰
   * @param {Date} expiresAt 리프레시 토큰 만료 시간
   */
  async saveRefreshToken(props: { userId: number; token: string; expiresAt: Date }): Promise<void> {
    await this.commandBus.execute(
      new SaveRefreshTokenCommand({
        userId: props.userId,
        token: props.token,
        expiresAt: props.expiresAt,
      }),
    );
  }

  /**
   * 이메일로 사용자 조회
   *
   * @param email 사용자 이메일
   * @returns {Promise<UserEntity>} 사용자 정보
   */
  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));

    if (!isDefined(user)) {
      throw new AppException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }
}

interface LoginUseCaseProps {
  bodyDto: LoginRequestBodyDto;
}
