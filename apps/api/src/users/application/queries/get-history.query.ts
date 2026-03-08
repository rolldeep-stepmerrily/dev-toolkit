import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';

export class GetHistoryQuery extends Query<HistoryRecord[]> {
  constructor(public readonly props: GetHistoryQueryProps) {
    super();
  }
}

@QueryHandler(GetHistoryQuery)
export class GetHistoryQueryHandler implements IQueryHandler<GetHistoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetHistoryQuery): Promise<HistoryRecord[]> {
    const { userId, limit } = query.props;

    return await this.prisma.toolHistory.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: limit,
    });
  }
}

export interface HistoryRecord {
  toolId: string;
  usedAt: Date;
}

interface GetHistoryQueryProps {
  userId: number;
  limit: number;
}
