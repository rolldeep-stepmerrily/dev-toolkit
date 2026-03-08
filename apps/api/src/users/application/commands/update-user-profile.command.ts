import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isDefined } from 'class-validator';
import { PrismaService } from 'src/common/prisma';
import { UserEntity } from 'src/users/entities/user.entity';

export class UpdateUserProfileCommand extends Command<UserEntity> {
  constructor(public readonly props: UpdateUserProfileCommandProps) {
    super();
  }
}

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileCommandHandler implements ICommandHandler<UpdateUserProfileCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserProfileCommand): Promise<UserEntity> {
    const { userId, name, avatarUrl } = command.props;

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(isDefined(name) && { name }),
        ...(isDefined(avatarUrl) && { avatarUrl }),
      },
    });
  }
}

interface UpdateUserProfileCommandProps {
  userId: number;
  name?: string | null;
  avatarUrl?: string | null;
}
