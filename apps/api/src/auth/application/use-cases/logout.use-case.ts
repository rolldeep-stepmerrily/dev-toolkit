import { Injectable } from '@nestjs/common';
import { TypedCommandBus } from 'src/common/cqrs';
import { DeleteRefreshTokenCommand } from '../command/delete-refresh-token.command';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly commandBus: TypedCommandBus<DeleteRefreshTokenCommand>) {}

  async execute(props: LogoutUseCaseProps): Promise<void> {
    const { userId, refreshToken } = props;

    await this.deleteRefreshToken({ userId, token: refreshToken });
  }

  /**
   * 리프레시 토큰 삭제
   *
   * @param {number} userId 사용자 ID
   * @param {string} token 삭제할 리프레시 토큰
   */
  async deleteRefreshToken(props: { userId: number; token: string }): Promise<void> {
    await this.commandBus.execute(new DeleteRefreshTokenCommand(props));
  }
}

interface LogoutUseCaseProps {
  userId: number;
  refreshToken: string;
}
