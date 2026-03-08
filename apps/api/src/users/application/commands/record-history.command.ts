import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class RecordHistoryCommand extends Command<void> {
  constructor(public readonly props: RecordHistoryCommandProps) {
    super();
  }
}

@CommandHandler(RecordHistoryCommand)
export class RecordHistoryCommandHandler implements ICommandHandler<RecordHistoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RecordHistoryCommand): Promise<void> {
    const { userId, toolId } = command.props;

    await this.prisma.toolHistory.create({ data: { userId, toolId } });
  }
}

interface RecordHistoryCommandProps {
  userId: number;
  toolId: string;
}
