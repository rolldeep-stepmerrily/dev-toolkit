import { Injectable } from '@nestjs/common';
import { TypedQueryBus } from 'src/common/cqrs';
import { GetBookmarksQuery } from '../queries/get-bookmarks.query';

@Injectable()
export class GetBookmarksUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetBookmarksQuery>) {}

  async execute(props: GetBookmarksUseCaseProps): Promise<string[]> {
    const { userId } = props;

    return this.getBookmarks(userId);
  }

  /**
   * 북마크된 toolId 목록 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<string[]>} 북마크된 toolId 배열
   */
  async getBookmarks(userId: number): Promise<string[]> {
    return await this.queryBus.execute(new GetBookmarksQuery({ userId }));
  }
}

interface GetBookmarksUseCaseProps {
  userId: number;
}
