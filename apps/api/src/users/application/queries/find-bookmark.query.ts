import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class FindBookmarkQuery extends Query<BookmarkRecord | null> {
  constructor(public readonly props: FindBookmarkQueryProps) {
    super();
  }
}

@QueryHandler(FindBookmarkQuery)
export class FindBookmarkQueryHandler implements IQueryHandler<FindBookmarkQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindBookmarkQuery): Promise<BookmarkRecord | null> {
    const { userId, toolId } = query.props;

    return await this.prisma.bookmark.findUnique({
      where: { userId_toolId: { userId, toolId } },
    });
  }
}

export interface BookmarkRecord {
  id: number;
  userId: number;
  toolId: string;
  createdAt: Date;
}

interface FindBookmarkQueryProps {
  userId: number;
  toolId: string;
}
