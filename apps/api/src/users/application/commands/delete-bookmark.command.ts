import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class DeleteBookmarkCommand extends Command<void> {
  constructor(public readonly props: DeleteBookmarkCommandProps) {
    super();
  }
}

@CommandHandler(DeleteBookmarkCommand)
export class DeleteBookmarkCommandHandler implements ICommandHandler<DeleteBookmarkCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteBookmarkCommand): Promise<void> {
    const { bookmarkId } = command.props;

    await this.prisma.bookmark.delete({ where: { id: bookmarkId } });
  }
}

interface DeleteBookmarkCommandProps {
  bookmarkId: number;
}
