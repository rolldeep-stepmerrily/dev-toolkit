import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { UserEntity } from 'src/users/entities/user.entity';

export class SaveUserCommand extends Command<UserEntity> {
  constructor(public readonly props: SaveUserCommandProps) {
    super();
  }
}

@CommandHandler(SaveUserCommand)
export class SaveUserCommandHandler implements ICommandHandler<SaveUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SaveUserCommand): Promise<UserEntity> {
    const { email, password, name } = command.props;

    const user = await this.prisma.user.create({
      data: { email, password, name },
    });

    return user;
  }
}

interface SaveUserCommandProps {
  email: string;
  password: string;
  name?: string;
}
