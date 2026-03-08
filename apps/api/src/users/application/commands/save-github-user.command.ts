import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { UserEntity } from 'src/users/entities/user.entity';

export class SaveGithubUserCommand extends Command<UserEntity> {
  constructor(public readonly props: SaveGithubUserCommandProps) {
    super();
  }
}

@CommandHandler(SaveGithubUserCommand)
export class SaveGithubUserCommandHandler implements ICommandHandler<SaveGithubUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SaveGithubUserCommand): Promise<UserEntity> {
    const { email, name, avatarUrl } = command.props;

    return await this.prisma.user.create({
      data: { email, name, avatarUrl },
    });
  }
}

interface SaveGithubUserCommandProps {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}
