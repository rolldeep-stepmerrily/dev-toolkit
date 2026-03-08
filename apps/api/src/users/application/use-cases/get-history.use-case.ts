import { Injectable } from '@nestjs/common';
import { TypedQueryBus } from 'src/common/cqrs';
import { HistoryEntity } from 'src/users/entities/history.entity';
import { GetHistoryQuery, HistoryRecord } from '../queries/get-history.query';

const HISTORY_DISPLAY_LIMIT = 10;
const HISTORY_FETCH_LIMIT = 100;

@Injectable()
export class GetHistoryUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetHistoryQuery>) {}

  async execute(props: GetHistoryUseCaseProps): Promise<HistoryEntity[]> {
    const { userId } = props;

    const entries = await this.getHistory(userId);

    return this.deduplicateAndLimit(entries);
  }

  /**
   * 도구 사용 히스토리 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<HistoryRecord[]>} 히스토리 레코드 목록
   */
  async getHistory(userId: number): Promise<HistoryRecord[]> {
    return await this.queryBus.execute(new GetHistoryQuery({ userId, limit: HISTORY_FETCH_LIMIT }));
  }

  /**
   * 중복 제거 후 최대 N개로 제한
   *
   * @param {HistoryRecord[]} entries 원본 히스토리 목록 (최신순)
   * @returns {HistoryEntity[]} 중복 제거된 히스토리 목록
   */
  deduplicateAndLimit(entries: HistoryRecord[]): HistoryEntity[] {
    const seen = new Set<string>();
    const result: HistoryEntity[] = [];

    for (const entry of entries) {
      if (seen.has(entry.toolId)) {
        continue;
      }

      seen.add(entry.toolId);
      result.push({ toolId: entry.toolId, usedAt: entry.usedAt });

      if (result.length >= HISTORY_DISPLAY_LIMIT) {
        break;
      }
    }

    return result;
  }
}

interface GetHistoryUseCaseProps {
  userId: number;
}
