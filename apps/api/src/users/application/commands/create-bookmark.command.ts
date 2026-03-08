import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class CreateBookmarkCommand extends Command<void> {
  constructor(public readonly props: CreateBookmarkCommandProps) {
    super();
  }
}

@CommandHandler(CreateBookmarkCommand)
export class CreateBookmarkCommandHandler implements ICommandHandler<CreateBookmarkCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateBookmarkCommand): Promise<void> {
    const { userId, toolId } = command.props;

    await this.prisma.bookmark.create({ data: { userId, toolId } });
  }
}

interface CreateBookmarkCommandProps {
  userId: number;
  toolId: string;
}
