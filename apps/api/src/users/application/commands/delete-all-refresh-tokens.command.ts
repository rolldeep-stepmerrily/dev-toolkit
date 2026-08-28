import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class DeleteAllRefreshTokensCommand extends Command<void> {
  constructor(public readonly props: DeleteAllRefreshTokensCommandProps) {
    super();
  }
}

@CommandHandler(DeleteAllRefreshTokensCommand)
export class DeleteAllRefreshTokensCommandHandler implements ICommandHandler<DeleteAllRefreshTokensCommand> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자의 모든 refresh token 삭제 실행
   *
   * @param {DeleteAllRefreshTokensCommand} command 커맨드
   */
  async execute(command: DeleteAllRefreshTokensCommand): Promise<void> {
    const { userId } = command.props;

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}

interface DeleteAllRefreshTokensCommandProps {
  userId: number;
}
