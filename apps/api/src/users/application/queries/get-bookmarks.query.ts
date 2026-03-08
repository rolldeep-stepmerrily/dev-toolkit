import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class GetBookmarksQuery extends Query<string[]> {
  constructor(public readonly props: GetBookmarksQueryProps) {
    super();
  }
}

@QueryHandler(GetBookmarksQuery)
export class GetBookmarksQueryHandler implements IQueryHandler<GetBookmarksQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBookmarksQuery): Promise<string[]> {
    const { userId } = query.props;

    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return bookmarks.map((b: { toolId: string }) => b.toolId);
  }
}

interface GetBookmarksQueryProps {
  userId: number;
}
