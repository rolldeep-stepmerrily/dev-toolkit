import { Injectable } from '@nestjs/common';
import { TypedCommandBus } from 'src/common/cqrs';
import { RecordHistoryCommand } from '../commands/record-history.command';

@Injectable()
export class RecordHistoryUseCase {
  constructor(private readonly commandBus: TypedCommandBus<RecordHistoryCommand>) {}

  async execute(props: RecordHistoryUseCaseProps): Promise<void> {
    const { userId, toolId } = props;

    await this.recordHistory(userId, toolId);
  }

  /**
   * 도구 사용 기록 추가
   *
   * @param {number} userId 사용자 ID
   * @param {string} toolId 도구 ID
   */
  async recordHistory(userId: number, toolId: string): Promise<void> {
    await this.commandBus.execute(new RecordHistoryCommand({ userId, toolId }));
  }
}

interface RecordHistoryUseCaseProps {
  userId: number;
  toolId: string;
}
