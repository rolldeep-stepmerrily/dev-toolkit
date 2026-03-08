import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class SaveRefreshTokenCommand extends Command<void> {
  constructor(public readonly props: SaveRefreshTokenCommandProps) {
    super();
  }
}

@CommandHandler(SaveRefreshTokenCommand)
export class SaveRefreshTokenCommandHandler implements ICommandHandler<SaveRefreshTokenCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SaveRefreshTokenCommand): Promise<void> {
    const { userId, token, expiresAt } = command.props;

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }
}

interface SaveRefreshTokenCommandProps {
  userId: number;
  token: string;
  expiresAt: Date;
}
