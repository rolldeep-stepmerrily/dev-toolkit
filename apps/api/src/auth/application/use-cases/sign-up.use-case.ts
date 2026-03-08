/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입이 ms의 StringValue를 요구하나 string과 호환되지 않는 라이브러리 타입 이슈 */
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';
import { AUTH_ERRORS } from 'src/auth/auth.error';
import { SignUpRequestBodyDto, SignUpResponseDataDto } from 'src/auth/presenter/http/dto/signup.dto';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import { PrismaService } from 'src/common/prisma';
import { SaveUserCommand } from 'src/users/application/commands/save-user.command';
import { UserEntity } from 'src/users/entities/user.entity';
import { GetOneUserByEmailQuery } from '../../../users/application/queries/get-one-user-by-email.query';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveUserCommand | SaveRefreshTokenCommand>,
    private readonly queryBus: TypedQueryBus<GetOneUserByEmailQuery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(props: SignUpUseCaseProps): Promise<SignUpResponseDataDto> {
    const { email, password, name } = props.bodyDto;

    // 이메일 중복 체크
    await this.checkEmailDuplication(email);

    const hashedPassword = await this.hashPassword(password);

    const tokens = await this.prisma.$transaction(async () => {
      const user = await this.signUp({ email, hashedPassword, name });

      return await this.issueTokens(user);
    });

    return this.buildResponseDataDto(tokens);
  }

  /**
   * 응답 데이터 생성
   *
   * @param {string} accessToken 액세스 토큰
   * @param {string} refreshToken 리프레시 토큰
   * @returns {Promise<SignUpResponseDataDto>} 응답 데이터
   */
  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): SignUpResponseDataDto {
    return SignUpResponseDataDto.from(tokens);
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
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as any,
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
   * 사용자 저장
   *
   * @param {string} email 이메일
   * @param {string} hashedPassword 해시된 비밀번호
   * @param {string} name 이름
   * @returns {Promise<UserEntity>} 사용자 정보
   */
  async signUp(props: { email: string; hashedPassword: string; name?: string }): Promise<UserEntity> {
    const { email, hashedPassword, name } = props;

    return await this.commandBus.execute(
      new SaveUserCommand({
        email,
        password: hashedPassword,
        name,
      }),
    );
  }

  /**
   * 비밀번호 해시
   *
   * @param {string} password 비밀번호
   * @returns {Promise<string>} 해시된 비밀번호
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * 이메일 중복 체크
   *
   * @param {string} email 이메일
   * @throws {AppException} 이미 사용 중인 이메일인 경우
   */
  async checkEmailDuplication(email: string): Promise<void> {
    const user = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));

    if (isDefined(user)) {
      throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }
  }
}

interface SignUpUseCaseProps {
  bodyDto: SignUpRequestBodyDto;
}
