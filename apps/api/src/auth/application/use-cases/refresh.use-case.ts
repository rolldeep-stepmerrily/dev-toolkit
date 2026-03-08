/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입이 ms의 StringValue를 요구하나 string과 호환되지 않는 라이브러리 타입 이슈 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { RefreshResponseDataDto } from 'src/auth/presenter/http/dto/refresh.dto';
import { TypedCommandBus } from 'src/common/cqrs';
import { DeleteRefreshTokenCommand } from '../command/delete-refresh-token.command';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveRefreshTokenCommand | DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(props: RefreshUseCaseProps): Promise<RefreshResponseDataDto> {
    const { userId, email, oldToken } = props;

    await this.deleteRefreshToken(oldToken);

    const tokens = await this.issueTokens(userId, email);

    return this.buildResponseDataDto(tokens);
  }

  /**
   * 응답 데이터 생성
   *
   * @param {string} accessToken 액세스 토큰
   * @param {string} refreshToken 리프레시 토큰
   * @returns {RefreshResponseDataDto} 응답 데이터
   */
  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): RefreshResponseDataDto {
    return RefreshResponseDataDto.from(tokens);
  }

  /**
   * 액세스/리프레시 토큰 쌍 발급 및 리프레시 토큰 저장
   *
   * @param {number} userId 사용자 ID
   * @param {string} email 사용자 이메일
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} 발급된 토큰 쌍
   */
  async issueTokens(userId: number, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

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

    await this.saveRefreshToken({ userId, token: tokens.refreshToken, expiresAt });

    return tokens;
  }

  /**
   * 리프레시 토큰 저장
   *
   * @param {number} userId 사용자 ID
   * @param {string} token 리프레시 토큰
   * @param {Date} expiresAt 만료 시간
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
   * 기존 리프레시 토큰 삭제
   *
   * @param {string} token 삭제할 리프레시 토큰
   */
  async deleteRefreshToken(token: string): Promise<void> {
    await this.commandBus.execute(new DeleteRefreshTokenCommand({ token }));
  }
}

interface RefreshUseCaseProps {
  userId: number;
  email: string;
  oldToken: string;
}
