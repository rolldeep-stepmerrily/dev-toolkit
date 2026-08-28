import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class SoftDeleteUserCommand extends Command<void> {
  constructor(public readonly props: SoftDeleteUserCommandProps) {
    super();
  }
}

@CommandHandler(SoftDeleteUserCommand)
export class SoftDeleteUserCommandHandler implements ICommandHandler<SoftDeleteUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 소프트 삭제 실행
   *
   * @param {SoftDeleteUserCommand} command 소프트 삭제 커맨드
   */
  async execute(command: SoftDeleteUserCommand): Promise<void> {
    const { userId } = command.props;

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
}

interface SoftDeleteUserCommandProps {
  userId: number;
}
