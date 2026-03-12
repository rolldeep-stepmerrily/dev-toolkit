import { Injectable } from '@nestjs/common';
import { TypedCommandBus } from 'src/common/cqrs';
import { DeleteAllRefreshTokensCommand } from '../commands/delete-all-refresh-tokens.command';
import { SoftDeleteUserCommand } from '../commands/soft-delete-user.command';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly commandBus: TypedCommandBus<DeleteAllRefreshTokensCommand | SoftDeleteUserCommand>) {}

  /**
   * 회원 탈퇴 실행 — refresh token 전체 삭제 후 소프트 삭제
   *
   * @param {DeleteUserUseCaseProps} props 요청 데이터
   */
  async execute(props: DeleteUserUseCaseProps): Promise<void> {
    const { userId } = props;

    await this.commandBus.execute(new DeleteAllRefreshTokensCommand({ userId }));
    await this.commandBus.execute(new SoftDeleteUserCommand({ userId }));
  }
}

interface DeleteUserUseCaseProps {
  userId: number;
}
