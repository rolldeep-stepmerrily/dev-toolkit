import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypedCommandBus } from 'src/common/cqrs';
import { RedisService } from 'src/common/redis';
import { DeleteRefreshTokenCommand } from '../command/delete-refresh-token.command';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async execute(props: LogoutUseCaseProps): Promise<void> {
    const { userId, refreshToken, accessToken } = props;

    await Promise.all([
      this.deleteRefreshToken({ userId, token: refreshToken }),
      this.blacklistAccessToken(accessToken),
    ]);
  }

  /**
   * 리프레시 토큰 삭제
   *
   * @param {number} userId 사용자 ID
   * @param {string} token 삭제할 리프레시 토큰
   */
  private async deleteRefreshToken(props: { userId: number; token: string }): Promise<void> {
    await this.commandBus.execute(new DeleteRefreshTokenCommand(props));
  }

  /**
   * Access token을 Redis 블랙리스트에 추가
   *
   * @param {string} token Access token
   */
  private async blacklistAccessToken(token: string): Promise<void> {
    if (!token) return;

    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) return;

    const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

    await this.redisService.addToBlacklist(token, ttlSeconds);
  }
}

interface LogoutUseCaseProps {
  userId: number;
  refreshToken: string;
  accessToken: string;
}
