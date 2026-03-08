import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import { CreateBookmarkCommand } from '../commands/create-bookmark.command';
import { DeleteBookmarkCommand } from '../commands/delete-bookmark.command';
import { BookmarkRecord, FindBookmarkQuery } from '../queries/find-bookmark.query';
import { GetBookmarksQuery } from '../queries/get-bookmarks.query';

@Injectable()
export class ToggleBookmarkUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<CreateBookmarkCommand | DeleteBookmarkCommand>,
    private readonly queryBus: TypedQueryBus<FindBookmarkQuery | GetBookmarksQuery>,
  ) {}

  async execute(props: ToggleBookmarkUseCaseProps): Promise<string[]> {
    const { userId, toolId } = props;

    const existing = await this.findBookmark(userId, toolId);

    if (isDefined(existing)) {
      await this.deleteBookmark(existing.id);
    } else {
      await this.createBookmark(userId, toolId);
    }

    return this.getBookmarks(userId);
  }

  /**
   * 특정 북마크 조회
   *
   * @param {number} userId 사용자 ID
   * @param {string} toolId 도구 ID
   * @returns {Promise<BookmarkRecord | null>} 북마크 레코드
   */
  async findBookmark(userId: number, toolId: string): Promise<BookmarkRecord | null> {
    return await this.queryBus.execute(new FindBookmarkQuery({ userId, toolId }));
  }

  /**
   * 북마크 추가
   *
   * @param {number} userId 사용자 ID
   * @param {string} toolId 도구 ID
   */
  async createBookmark(userId: number, toolId: string): Promise<void> {
    await this.commandBus.execute(new CreateBookmarkCommand({ userId, toolId }));
  }

  /**
   * 북마크 삭제
   *
   * @param {number} bookmarkId 북마크 ID
   */
  async deleteBookmark(bookmarkId: number): Promise<void> {
    await this.commandBus.execute(new DeleteBookmarkCommand({ bookmarkId }));
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

interface ToggleBookmarkUseCaseProps {
  userId: number;
  toolId: string;
}
